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

const BLOCKED_PATTERNS: { re: RegExp; category: string }[] = [
  // Direct execution
  { re: /process\.exit/,                          category: 'process_control' },
  { re: /eval\s*\(/,                              category: 'dynamic_eval' },
  { re: /new\s+Function\s*\(/,                    category: 'dynamic_eval' },
  { re: /Function\s*\(\s*['"`]/,                  category: 'dynamic_eval' },
  // Dynamic import / require abuse
  { re: /require\s*\(\s*['"`]child_process/,      category: 'child_process' },
  { re: /import\s*\(\s*['"`]child_process/,       category: 'child_process' },
  { re: /require\s*\(\s*['"`]cluster/,            category: 'child_process' },
  { re: /\bexec\s*\(/,                            category: 'child_process' },
  { re: /\bspawn\s*\(/,                           category: 'child_process' },
  { re: /\bfork\s*\(/,                            category: 'child_process' },
  // Destructive filesystem
  { re: /fs\.(rmdir|unlink|rm|rmSync|unlinkSync)/, category: 'filesystem' },
  { re: /require\s*\(\s*['"`]fs['"`]\s*\)/,       category: 'filesystem' },
  // Module cache poisoning
  { re: /delete\s+require\.cache/,                category: 'module_cache' },
  { re: /require\.cache\s*\[/,                    category: 'module_cache' },
  // Prototype pollution
  { re: /__proto__/,                              category: 'prototype_pollution' },
  { re: /Object\.prototype\s*\[/,                 category: 'prototype_pollution' },
  { re: /prototype\.constructor/,                 category: 'prototype_pollution' },
  // Serialization gadget attacks (JSON.parse of untrusted data in key positions)
  { re: /JSON\.parse\s*\(\s*process\./,           category: 'serialization_gadget' },
  // VM escape
  { re: /require\s*\(\s*['"`]vm['"`]/,            category: 'vm_escape' },
  { re: /vm\.(runInNewContext|runInThisContext)/,  category: 'vm_escape' },
  // Event bus flooding guard (ThoughtBroker wildcard poisoning)
  { re: /broker\.subscribe\s*\(\s*['"]\*/,        category: 'event_bus_abuse' },
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
    for (const { re, category } of BLOCKED_PATTERNS) {
      if (re.test(code)) {
        return this.record({
          type: 'unsafe_code',
          agentId,
          detail: `Blocked pattern [${category}]: ${re.source}`,
          severity: 'critical',
        });
      }
    }
    return null;
  }

  /**
   * Guard ThoughtBroker wildcard subscriptions.
   * Wildcard ('*') subscriptions are a legitimate feature but become an attack
   * surface when an agent registers an unbounded number of them. Allow at most
   * maxWildcards per agentId.
   */
  checkWildcardSubscription(agentId: string, topic: string, maxWildcards = 3): ShieldViolation | null {
    if (topic !== '*') return null;
    const key = `wildcard:${agentId}`;
    const count = (this.rateLimits.get(key)?.count ?? 0) + 1;
    this.rateLimits.set(key, { count, windowStart: Date.now() });
    if (count > maxWildcards) {
      return this.record({
        type: 'unauthorized_action',
        agentId,
        detail: `Wildcard subscription limit exceeded (${count} > ${maxWildcards})`,
        severity: 'high',
      });
    }
    return null;
  }

  /** Validate a JSON-parsed payload for prototype pollution keys. */
  scanPayload(agentId: string, payload: unknown): ShieldViolation | null {
    const json = JSON.stringify(payload);
    if (json.includes('__proto__') || json.includes('constructor') && json.includes('prototype')) {
      return this.record({
        type: 'data_exfiltration',
        agentId,
        detail: 'Payload contains prototype pollution keys (__proto__ / constructor)',
        severity: 'critical',
      });
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
