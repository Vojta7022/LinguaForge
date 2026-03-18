/** Formats a number of seconds into M:SS */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Formats XP value with k suffix for large numbers */
export function formatXP(xp: number): string {
  if (xp >= 10_000) return `${(xp / 1000).toFixed(1)}k`;
  return xp.toLocaleString();
}

/** Formats a YYYY-MM-DD date as a human-readable string */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Formats a percentage 0–1 as "85%" */
export function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}
