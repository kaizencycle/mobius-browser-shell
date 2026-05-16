import { WallClockScheduler } from '../scheduler/WallClockScheduler';

describe('WallClockScheduler', () => {
  let scheduler: WallClockScheduler;

  beforeEach(() => {
    scheduler = new WallClockScheduler({ tickMs: 50 });
  });

  afterEach(() => {
    scheduler.stop();
  });

  it('registers a task and marks as running', () => {
    scheduler.schedule({
      id: 'task-1',
      cron: '*/1 * * * *',
      agentType: 'world',
      handler: async () => {},
      enabled: true,
    });
    expect(scheduler.getTasks()).toHaveLength(1);
  });

  it('starts and stops cleanly', () => {
    scheduler.start();
    expect(scheduler.isRunning()).toBe(true);
    scheduler.stop();
    expect(scheduler.isRunning()).toBe(false);
  });

  it('fires task after computed interval', async () => {
    let called = false;
    scheduler.schedule({
      id: 'fast-task',
      cron: '*/1 * * * * *', // every 1 second (6-field)
      agentType: 'system',
      handler: async () => { called = true; },
      enabled: true,
    });
    scheduler.start();
    await new Promise(r => setTimeout(r, 1200));
    expect(called).toBe(true);
  });

  it('unschedules a task', () => {
    scheduler.schedule({ id: 'removable', cron: '* * * * *', agentType: 'system', handler: async () => {}, enabled: true });
    scheduler.unschedule('removable');
    expect(scheduler.getTasks()).toHaveLength(0);
  });
});
