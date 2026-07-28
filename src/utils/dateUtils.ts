/** Returns true if the given ISO date string is strictly before the start of today. */
export function isOverdue(isoDate: string): boolean {
  const due = new Date(isoDate);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return due.getTime() < startOfToday.getTime();
}

/** Formats an ISO date string as a short, friendly label (e.g. "Today", "Tomorrow", "Aug 3"). */
export function formatDueDate(isoDate: string): string {
  const due = new Date(isoDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDay = new Date(due);
  dueDay.setHours(0, 0, 0, 0);

  const diffDays = Math.round((dueDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';

  return due.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
