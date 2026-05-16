/**
 * PR-013 · CitizenShield
 * Security sandbox for agent-generated code and actions.
 * Detects violations, rate-limits, and enforces constitutional constraints.
 */

export type ViolationType =
  | 'unsafe_code'
  | 'rate_limit'
  | 'unauthorized_action'
  | 'data_exfiltration'
  | 'resource_exhaustion';

export interface ShieldViolation {
  id: string;
  type: ViolationType;
  agentId: string;
  detail: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const BLOCKED_PATTERNS = [
  /process\.exit/,
  /require\s*\(\s*['"`]child_process/,
  /eval\s*\(/,
  /Function\s*\(/,
  /\bexec\s*\(/,
  /\bspawn\s*\(/,
  /fs\.rmdir|fs\.unlink|fs\.rm\b/,
  /delete\s+require\.cache/,
];

export class CitizenShield {
  private violations: ShieldViolation[] = [];
  private rateLimits = new Map<string, RateLimitEntry>();
  private readonly maxActionsPerMinute: number;
  private violationCounter = 0;

  constructor(opts: { maxActionsPerMinute?: number } = {}) {
    this.maxActionsPerMinute = opts.maxActionsPerMinute ?? 60;
  }

  /** Scan a code string for unsafe patterns before execution. */
  scanCode(agentId: string, code: string): ShieldViolation | null {
    for (const pattern of BLOCKED_PATTERNS) {
      if (pattern.test(code)) {
        return this.record({
          type: 'unsafe_code',
          agentId,
          detail: `Blocked pattern: ${pattern.source}`,
          severity: 'critical',
        });
      }
    }
    return null;
  }

  /** Check rate limit for an agent. Returns violation if exceeded. */
  checkRateLimit(agentId: string): ShieldViolation | null {
    const now = Date.now();
    const entry = this.rateLimits.get(agentId);

    if (!entry || now - entry.windowStart > 60_000) {
      this.rateLimits.set(agentId, { count: 1, windowStart: now });
      return null;
    }

    entry.count++;
    if (entry.count > this.maxActionsPerMinute) {
      return this.record({
        type: 'rate_limit',
        agentId,
        detail: `${entry.count} actions in 60s (limit: ${this.maxActionsPerMinute})`,
        severity: 'high',
      });
    }
    return null;
  }

  /** Validate that an agent is allowed to perform a given action. */
  authorizeAction(agentId: string, action: string, allowedActions: string[]): ShieldViolation | null {
    if (!allowedActions.includes(action)) {
      return this.record({
        type: 'unauthorized_action',
        agentId,
        detail: `Action "${action}" not in allowed list`,
        severity: 'medium',
      });
    }
    return null;
  }

  private record(opts: Omit<ShieldViolation, 'id' | 'timestamp'>): ShieldViolation {
    const violation: ShieldViolation = {
      id: `sv-${++this.violationCounter}`,
      timestamp: Date.now(),
      ...opts,
    };
    this.violations.push(violation);
    return violation;
  }

  getViolations(agentId?: string): ShieldViolation[] {
    return agentId
      ? this.violations.filter(v => v.agentId === agentId)
      : [...this.violations];
  }

  getCriticalCount(): number {
    return this.violations.filter(v => v.severity === 'critical').length;
  }

  clearViolations(agentId?: string): void {
    this.violations = agentId
      ? this.violations.filter(v => v.agentId !== agentId)
      : [];
  }
}
