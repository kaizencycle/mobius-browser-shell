// components/Labs/ReflectionArchiveLane.tsx
// C-307 · EVE · Session localStorage archive of last 5 reflections with GI context
import React, { useState, useEffect } from 'react';

const ARCHIVE_KEY = 'eve_reflection_archive';
const MAX_ARCHIVE = 5;

export interface ArchivedReflection {
  id: string;
  title: string;
  bodyHash: string;
  gi: number | null;
  mode: string | null;
  cycle: string | null;
  timestamp: string;
  wordCount: number;
}

export function archiveReflection(entry: ArchivedReflection): void {
  try {
    const raw = localStorage.getItem(ARCHIVE_KEY);
    const existing: ArchivedReflection[] = raw ? (JSON.parse(raw) as ArchivedReflection[]) : [];
    const deduped = existing.filter((r) => r.id !== entry.id);
    const updated = [entry, ...deduped].slice(0, MAX_ARCHIVE);
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(updated));
  } catch {
    // localStorage unavailable — skip silently
  }
}

function loadArchive(): ArchivedReflection[] {
  try {
    const raw = localStorage.getItem(ARCHIVE_KEY);
    return raw ? (JSON.parse(raw) as ArchivedReflection[]) : [];
  } catch {
    return [];
  }
}

function modeColor(mode: string | null): string {
  if (mode === 'green') return 'text-emerald-600';
  if (mode === 'red') return 'text-rose-600';
  return 'text-amber-600';
}

export const ReflectionArchiveLane: React.FC = () => {
  const [archive, setArchive] = useState<ArchivedReflection[]>([]);

  useEffect(() => {
    setArchive(loadArchive());
    const handler = () => setArchive(loadArchive());
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  if (archive.length === 0) return null;

  return (
    <div className="px-4 sm:px-6 py-3 border-t border-stone-200 bg-stone-50">
      <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest mb-2">
        EVE · Reflection Archive
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {archive.map((r) => (
          <div
            key={r.id}
            className="flex-shrink-0 w-40 rounded border border-stone-200 bg-white p-2 flex flex-col gap-1"
          >
            <span className="text-[11px] font-semibold text-stone-700 truncate">{r.title || 'Untitled'}</span>
            <span className="text-[9px] text-stone-400">{new Date(r.timestamp).toLocaleDateString()}</span>
            <div className="flex items-center gap-1">
              {r.gi !== null && (
                <span className={`text-[9px] font-mono ${modeColor(r.mode)}`}>
                  GI {r.gi.toFixed(2)}
                </span>
              )}
              {r.cycle && (
                <span className="text-[9px] text-stone-400">· {r.cycle}</span>
              )}
            </div>
            <span className="text-[9px] text-stone-400">{r.wordCount}w</span>
          </div>
        ))}
      </div>
    </div>
  );
};
