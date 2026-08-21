import { useEffect, useMemo, useState } from 'react';

export interface LocalChamberTime {
  /** ISO timestamp for `<time datetime>` */
  iso: string;
  /** e.g. "Friday, 21 August" */
  dateLine: string;
  /** e.g. "1:04 am" */
  timeLine: string;
  /** Short timezone label, e.g. "PDT" */
  timeZone: string;
}

function formatLocalChamberTime(date: Date): LocalChamberTime {
  const dateLine = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);

  const timeLine = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);

  const timeZone =
    new Intl.DateTimeFormat(undefined, { timeZoneName: 'short' })
      .formatToParts(date)
      .find(part => part.type === 'timeZoneName')?.value ?? 'local';

  return {
    iso: date.toISOString(),
    dateLine,
    timeLine,
    timeZone,
  };
}

/** Live local date/time for chamber headers — updates every minute. */
export function useLocalChamberTime(): LocalChamberTime {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);

  return useMemo(() => formatLocalChamberTime(now), [now]);
}
