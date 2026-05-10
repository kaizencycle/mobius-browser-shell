// hooks/useAtlasWakeGuard.ts
// C-307 · ATLAS · polls OAA service health for per-chamber status pill
import { useState, useEffect } from 'react';
import { env } from '../config/env';

export type ServiceStatus = 'checking' | 'online' | 'cold' | 'error';

export function useAtlasWakeGuard(): ServiceStatus {
  const [status, setStatus] = useState<ServiceStatus>('checking');

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const oaaUrl = env.labs.oaa;
      if (!oaaUrl) {
        setStatus('online'); // demo mode — assume online
        return;
      }
      try {
        const start = Date.now();
        const res = await fetch(`${oaaUrl}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(4000),
          mode: 'no-cors', // Render services don't always expose CORS on /health
        });
        if (cancelled) return;
        const ms = Date.now() - start;
        // no-cors gives opaque response (type='opaque') — treat as online if we got through
        setStatus(ms > 2500 ? 'cold' : 'online');
      } catch {
        if (!cancelled) setStatus('error');
      }
    };
    check();
    return () => { cancelled = true; };
  }, []);

  return status;
}
