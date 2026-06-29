import React from 'react';

interface DegradedNoticeProps {
  show: boolean;
  message?: string;
}

/** Shown when live API data is unavailable — never blocks the chamber. */
export function DegradedNotice({
  show,
  message = 'Live data unavailable — showing last known state',
}: DegradedNoticeProps) {
  if (!show) return null;
  return (
    <div className="degraded-notice" role="status">
      <span className="degraded-notice-dot" aria-hidden />
      <span>{message}</span>
    </div>
  );
}
