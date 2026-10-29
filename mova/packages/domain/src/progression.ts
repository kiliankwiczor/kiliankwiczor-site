import type { Program } from './index.js';
export function programStep(p: Program, completed: number) {
  const total = p.weeks * p.days;
  const week = Math.min(p.weeks, Math.floor(completed / p.days) + 1);
  return {
    completed,
    total,
    week,
    ordinal: completed + 1,
    maintenance: completed >= total,
    reps: p.reps + Math.min(2, week - 1),
  };
}
export function challengeProgress(
  joinedAt: string,
  weeks: number,
  goal: number,
  completedAt: string[],
  now = Date.now(),
) {
  const start = Date.parse(joinedAt),
    day = 86400000,
    counts = Array.from({ length: weeks }, () => new Set<string>());
  const seenDays = new Set<string>();
  for (const value of [...completedAt].sort((a, b) => Date.parse(a) - Date.parse(b))) {
    const timestamp = Date.parse(value);
    const week = Math.floor((timestamp - start) / (7 * day));
    if (timestamp < start || timestamp > now || week < 0 || week >= weeks) continue;
    const date = new Intl.DateTimeFormat('fr-CA', {
      timeZone: 'Europe/Paris',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(timestamp));
    if (seenDays.has(date)) continue;
    seenDays.add(date);
    counts[week]!.add(date);
  }
  const progress = counts.map((s) => Math.min(goal, s.size));
  return {
    periods: progress,
    goal,
    weeks,
    currentPeriod: Math.min(weeks, Math.max(1, Math.floor((now - start) / (7 * day)) + 1)),
    complete: progress.every((n) => n >= goal),
    ended: now >= start + weeks * 7 * day,
  };
}
