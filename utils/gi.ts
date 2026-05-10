/**
 * utils/gi.ts
 *
 * Shared GI mode → Tailwind class helpers.
 * Consolidates duplicated color logic across chamber headers and archive components.
 */

export function giTextColor(mode: string | null | undefined, stale?: boolean): string {
  if (stale || !mode) return 'text-stone-400';
  if (mode === 'green') return 'text-emerald-400';
  if (mode === 'red') return 'text-rose-400';
  return 'text-amber-400';
}

export function giPillClass(mode: string | null | undefined, stale?: boolean): string {
  if (stale || !mode) return 'bg-stone-700 text-stone-300';
  if (mode === 'green') return 'bg-emerald-800 text-emerald-200';
  if (mode === 'red') return 'bg-rose-800 text-rose-200';
  return 'bg-amber-800 text-amber-200';
}

export function giLabel(mode: string | null | undefined, gi: number | undefined, stale?: boolean): string {
  if (stale || gi === undefined) return 'GI —';
  const tag = mode === 'green' ? '▲' : mode === 'red' ? '▼' : '◆';
  return `${tag} GI ${gi.toFixed(2)}`;
}
