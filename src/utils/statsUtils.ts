import { CategoryId, Task } from '../types/Task';
import { CATEGORIES } from '../constants/taskMeta';

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/**
 * Consecutive-day streak of "completed at least one task", counting from
 * today backward. If nothing has been completed yet today, the streak is
 * still considered "alive" as long as yesterday had a completion (the day
 * isn't over yet) — the same semantics used by most habit trackers.
 */
export function getCurrentStreak(tasks: Task[]): number {
  const completedDates = new Set(
    tasks.filter((t) => t.completed && t.completedAt).map((t) => toDateKey(new Date(t.completedAt as string)))
  );

  const cursor = startOfDay(new Date());
  if (!completedDates.has(toDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (completedDates.has(toDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export interface DayCount {
  label: string;
  dateKey: string;
  count: number;
}

/** Completions per day for the last 7 days (oldest first, today last). */
export function getLast7DaysCompletions(tasks: Task[]): DayCount[] {
  const counts = new Map<string, number>();
  for (const t of tasks) {
    if (!t.completed || !t.completedAt) continue;
    const key = toDateKey(new Date(t.completedAt));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const days: DayCount[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = startOfDay(new Date());
    d.setDate(d.getDate() - i);
    const key = toDateKey(d);
    days.push({
      label: d.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2),
      dateKey: key,
      count: counts.get(key) ?? 0,
    });
  }
  return days;
}

export interface CategoryStat {
  category: CategoryId;
  total: number;
  completed: number;
}

export function getCategoryBreakdown(tasks: Task[]): CategoryStat[] {
  return CATEGORIES.map((c) => {
    const inCategory = tasks.filter((t) => t.category === c.id);
    return {
      category: c.id,
      total: inCategory.length,
      completed: inCategory.filter((t) => t.completed).length,
    };
  }).filter((c) => c.total > 0);
}

export interface CompletionStats {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  completedToday: number;
  currentStreak: number;
  last7Days: DayCount[];
  categoryBreakdown: CategoryStat[];
}

export function getCompletionStats(tasks: Task[]): CompletionStats {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const todayKey = toDateKey(new Date());
  const completedToday = tasks.filter(
    (t) => t.completed && t.completedAt && toDateKey(new Date(t.completedAt)) === todayKey
  ).length;

  return {
    totalTasks,
    completedTasks,
    completionRate: totalTasks === 0 ? 0 : completedTasks / totalTasks,
    completedToday,
    currentStreak: getCurrentStreak(tasks),
    last7Days: getLast7DaysCompletions(tasks),
    categoryBreakdown: getCategoryBreakdown(tasks),
  };
}
