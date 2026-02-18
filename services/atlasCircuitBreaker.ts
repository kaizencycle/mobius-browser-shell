/**
 * ATLAS Circuit Breaker
 *
 * States:
 * - CLOSED: Healthy, requests pass through
 * - OPEN: ATLAS down, requests fail fast
 * - HALF_OPEN: Testing if ATLAS recovered
 */

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeoutMs: number;
  halfOpenMaxRequests: number;
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeoutMs: 30000, // 30s
  halfOpenMaxRequests: 3,
};

class AtlasCircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private successCount = 0;
  private nextAttempt = Date.now();
  private halfOpenRequests = 0;
  private config: CircuitBreakerConfig;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  getState(): CircuitState {
    if (this.state === 'OPEN' && Date.now() >= this.nextAttempt) {
      this.state = 'HALF_OPEN';
      this.halfOpenRequests = 0;
      this.successCount = 0;
      if (typeof console !== 'undefined' && console.log) {
        console.log('[ATLAS-CB] Entering HALF_OPEN state');
      }
    }
    return this.state;
  }

  canExecute(): boolean {
    const state = this.getState();

    if (state === 'CLOSED') return true;
    if (state === 'OPEN') return false;

    // HALF_OPEN: allow limited test requests
    if (this.halfOpenRequests < this.config.halfOpenMaxRequests) {
      this.halfOpenRequests++;
      return true;
    }
    return false;
  }

  recordSuccess(): void {
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= this.config.halfOpenMaxRequests) {
        this.close();
      }
    } else {
      this.failureCount = 0;
    }
  }

  recordFailure(): void {
    this.failureCount++;

    if (this.state === 'HALF_OPEN') {
      this.open();
      return;
    }

    if (this.failureCount >= this.config.failureThreshold) {
      this.open();
    }
  }

  private open(): void {
    this.state = 'OPEN';
    this.nextAttempt = Date.now() + this.config.resetTimeoutMs;
    if (typeof console !== 'undefined' && console.warn) {
      console.warn(
        `[ATLAS-CB] Circuit OPENED until ${new Date(this.nextAttempt).toISOString()}`
      );
    }
  }

  private close(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.halfOpenRequests = 0;
    if (typeof console !== 'undefined' && console.log) {
      console.log('[ATLAS-CB] Circuit CLOSED (healthy)');
    }
  }

  getMetrics(): { state: CircuitState; failureCount: number; nextAttempt: number } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      nextAttempt: this.nextAttempt,
    };
  }
}

export const atlasCircuitBreaker = new AtlasCircuitBreaker();

/**
 * Execute a function with circuit breaker protection
 */
export async function withCircuitBreaker<T>(
  fn: () => Promise<T>,
  fallback?: T
): Promise<T | undefined> {
  if (!atlasCircuitBreaker.canExecute()) {
    if (typeof console !== 'undefined' && console.log) {
      console.log('[ATLAS-CB] Request blocked by circuit breaker');
    }
    return fallback;
  }

  try {
    const result = await fn();
    atlasCircuitBreaker.recordSuccess();
    return result;
  } catch (error) {
    atlasCircuitBreaker.recordFailure();
    throw error;
  }
}
