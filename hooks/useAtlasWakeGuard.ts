import { useState, useEffect } from 'react';
import { env } from '../config/env';

export type ServiceStatus = 'checking' | 'online' | 'cold' | 'error';

const RECHECK_INTERVAL_MS = 30_000;

export function useAtlasWakeGuard(): ServiceStatus {
  const [status, setStatus] = useState<ServiceStatus>('checking');

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const oaaUrl = env.labs.oaa;
      if (!oaaUrl) {
        setStatus('online');
        return;
      }
      try {
        const start = Date.now();
        await fetch(`${oaaUrl}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(4000),
          // no-cors: Render services don't always expose CORS on /health;
          // opaque response still confirms the service is reachable
          mode: 'no-cors',
        });
        if (cancelled) return;
        setStatus(Date.now() - start > 2500 ? 'cold' : 'online');
      } catch {
        if (!cancelled) setStatus('error');
      }
    };
    void check();
    const interval = setInterval(() => { void check(); }, RECHECK_INTERVAL_MS);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  return status;
}
