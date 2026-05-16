/**
 * SWARM-18 Agent Core — entry point
 * Starts the OrchestratorBootstrap and runs until SIGTERM/SIGINT.
 */
import { OrchestratorBootstrap } from './core/OrchestratorBootstrap';

const bootstrap = new OrchestratorBootstrap({
  oaaDir:            process.env['OAA_MEMORY_DIR'] ?? './data',
  hmacKey:           process.env['OAA_HMAC_KEY']  ?? 'dev-key-change-in-production',
  dvKey:             process.env['DVA_VERIFICATION_KEY'] ?? 'dev-dva-key',
  syncIntervalMs:    Number(process.env['HIVE_SYNC_INTERVAL_MS']    ?? 5000),
  sentinelIntervalMs:Number(process.env['SENTINEL_CHECK_INTERVAL_MS'] ?? 60_000),
  schedulerTickMs:   Number(process.env['SCHEDULER_TICK_MS']        ?? 1000),
});

bootstrap.on('bootstrap:ready', () => {
  console.log('[SWARM-18] System online — all subsystems nominal');
});
bootstrap.on('bootstrap:degraded', (health) => {
  console.warn('[SWARM-18] System degraded:', health.status);
});
bootstrap.on('bootstrap:shutdown_complete', (info: { uptime: number }) => {
  console.log(`[SWARM-18] Clean shutdown — uptime ${Math.round(info.uptime / 1000)}s`);
});

const shutdown = async () => {
  await bootstrap.shutdown();
  process.exit(0);
};

process.once('SIGTERM', () => void shutdown());
process.once('SIGINT',  () => void shutdown());

bootstrap.initialize().catch(err => {
  console.error('[SWARM-18] Fatal initialization error:', err);
  process.exit(1);
});
