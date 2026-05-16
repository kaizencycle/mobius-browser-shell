// PR-003 · WallClockScheduler
// Deterministic wall-clock task scheduler for autonomous agent pipelines.
// Parses simple cron expressions and fires handlers on schedule.
// Supported syntax: "* * * * *" (minute-level) and "*/N" intervals.
import { EventEmitter } from 'events';

export type AgentType = 'world' | 'economy' | 'lore' | 'code' | 'sentinel' | 'system';

export interface ScheduledTask {
  id: string;
  cron: string;
  agentType: AgentType;
  handler: () => Promise<void>;
  enabled: boolean;
  lastRunAt?: number;
  nextRunAt?: number;
  runCount?: number;
  errorCount?: number;
}

interface CronField {
  type: 'wildcard' | 'interval' | 'exact';
  value?: number;
}

export class WallClockScheduler extends EventEmitter {
  private tasks: Map<string, ScheduledTask> = new Map();
  private timer: NodeJS.Timeout | null = null;
  private readonly tickMs: number;
  private running = false;
  // Single-flight guard: tracks which task IDs are currently executing.
  // A task is skipped on the next tick if it is still running from a previous
  // invocation — prevents overlapping executions under heavy load.
  private readonly activeTasks = new Set<string>();

  constructor(opts: { tickMs?: number } = {}) {
    super();
    this.tickMs = opts.tickMs ?? 1000;
  }

  schedule(task: ScheduledTask): void {
    task.runCount = 0;
    task.errorCount = 0;
    task.nextRunAt = this.computeNextRun(task.cron, Date.now());
    this.tasks.set(task.id, task);
    this.emit('task:registered', { id: task.id });
  }

  unschedule(id: string): void {
    this.tasks.delete(id);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.timer = setInterval(() => this.tick(), this.tickMs);
    this.emit('scheduler:started');
  }

  stop(): void {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    this.running = false;
    this.emit('scheduler:stopped');
  }

  private async tick(): Promise<void> {
    const now = Date.now();
    for (const task of this.tasks.values()) {
      if (!task.enabled || !task.nextRunAt || now < task.nextRunAt) continue;

      // Single-flight: skip this tick if a previous invocation is still running.
      // This prevents overlapping executions and backpressure cascade under load.
      if (this.activeTasks.has(task.id)) {
        this.emit('task:skipped', { id: task.id, reason: 'still_running' });
        continue;
      }

      task.lastRunAt = now;
      task.nextRunAt = this.computeNextRun(task.cron, now);
      task.runCount = (task.runCount ?? 0) + 1;

      this.activeTasks.add(task.id);
      this.emit('task:running', { id: task.id, runCount: task.runCount });

      // Run asynchronously so one slow task does not block others in the same tick.
      void (async () => {
        try {
          await task.handler();
          this.emit('task:complete', { id: task.id });
        } catch (err) {
          task.errorCount = (task.errorCount ?? 0) + 1;
          this.emit('task:error', { id: task.id, error: err });
        } finally {
          this.activeTasks.delete(task.id);
        }
      })();
    }
  }

  isTaskActive(id: string): boolean {
    return this.activeTasks.has(id);
  }

  // Parse a single cron field: '*' = wildcard, '*/N' = interval, 'N' = exact
  private parseField(field: string): CronField {
    if (field === '*') return { type: 'wildcard' };
    if (field.startsWith('*/')) return { type: 'interval', value: parseInt(field.slice(2), 10) };
    return { type: 'exact', value: parseInt(field, 10) };
  }

  // Compute the next run timestamp from a cron string.
  // Supports: 5-field (minute-level) and 6-field (second-level) expressions.
  private computeNextRun(cron: string, after: number): number {
    const fields = cron.trim().split(/\s+/);
    // 6-field (includes seconds): s m h dom mon dow
    const isSecondLevel = fields.length === 6;

    if (isSecondLevel) {
      const secField = this.parseField(fields[0]!);
      if (secField.type === 'interval' && secField.value) {
        return after + secField.value * 1000;
      }
      return after + 1000;
    }

    // Standard 5-field minute cron
    const minField = this.parseField(fields[0]!);
    if (minField.type === 'interval' && minField.value) {
      return after + minField.value * 60 * 1000;
    }
    if (minField.type === 'exact' && minField.value !== undefined) {
      // Next occurrence of that minute
      const d = new Date(after);
      d.setSeconds(0, 0);
      d.setMinutes(minField.value);
      if (d.getTime() <= after) d.setHours(d.getHours() + 1);
      return d.getTime();
    }
    // Wildcard: every minute
    return after + 60 * 1000;
  }

  getTasks(): ScheduledTask[] {
    return [...this.tasks.values()];
  }

  isRunning(): boolean {
    return this.running;
  }
}
