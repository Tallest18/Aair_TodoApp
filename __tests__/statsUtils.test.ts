import { getCategoryBreakdown, getCompletionStats, getCurrentStreak, getLast7DaysCompletions } from '../src/utils/statsUtils';
import { Task } from '../src/types/Task';

let nextId = 0;
function makeTask(overrides: Partial<Task> = {}): Task {
  nextId += 1;
  return {
    id: `task-${nextId}`,
    title: `Task ${nextId}`,
    completed: false,
    createdAt: new Date().toISOString(),
    priority: 'none',
    category: 'personal',
    subtasks: [],
    ...overrides,
  };
}

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

describe('statsUtils', () => {
  describe('getCompletionStats', () => {
    it('returns zeroed-out stats for an empty task list', () => {
      const stats = getCompletionStats([]);
      expect(stats.totalTasks).toBe(0);
      expect(stats.completedTasks).toBe(0);
      expect(stats.completionRate).toBe(0);
      expect(stats.currentStreak).toBe(0);
    });

    it('computes completion rate from completed vs total tasks', () => {
      const tasks = [makeTask({ completed: true, completedAt: daysAgoIso(0) }), makeTask({ completed: false })];
      const stats = getCompletionStats(tasks);
      expect(stats.totalTasks).toBe(2);
      expect(stats.completedTasks).toBe(1);
      expect(stats.completionRate).toBe(0.5);
    });

    it('counts tasks completed today separately from the overall total', () => {
      const tasks = [
        makeTask({ completed: true, completedAt: daysAgoIso(0) }),
        makeTask({ completed: true, completedAt: daysAgoIso(3) }),
      ];
      expect(getCompletionStats(tasks).completedToday).toBe(1);
    });
  });

  describe('getCurrentStreak', () => {
    it('is 0 when nothing has ever been completed', () => {
      expect(getCurrentStreak([makeTask()])).toBe(0);
    });

    it('is 1 when only today has a completion', () => {
      const tasks = [makeTask({ completed: true, completedAt: daysAgoIso(0) })];
      expect(getCurrentStreak(tasks)).toBe(1);
    });

    it('counts consecutive days including today', () => {
      const tasks = [
        makeTask({ completed: true, completedAt: daysAgoIso(0) }),
        makeTask({ completed: true, completedAt: daysAgoIso(1) }),
        makeTask({ completed: true, completedAt: daysAgoIso(2) }),
      ];
      expect(getCurrentStreak(tasks)).toBe(3);
    });

    it('stays alive if yesterday was completed but today has nothing yet', () => {
      const tasks = [makeTask({ completed: true, completedAt: daysAgoIso(1) })];
      expect(getCurrentStreak(tasks)).toBe(1);
    });

    it('resets to 0 across a gap day', () => {
      const tasks = [makeTask({ completed: true, completedAt: daysAgoIso(3) })];
      expect(getCurrentStreak(tasks)).toBe(0);
    });
  });

  describe('getLast7DaysCompletions', () => {
    it('returns exactly 7 days, ending with today', () => {
      const days = getLast7DaysCompletions([]);
      expect(days).toHaveLength(7);
      const todayKey = days[days.length - 1].dateKey;
      const today = new Date();
      expect(todayKey).toBe(`${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`);
    });

    it('places a completion on the correct day', () => {
      const tasks = [makeTask({ completed: true, completedAt: daysAgoIso(0) })];
      const days = getLast7DaysCompletions(tasks);
      expect(days[days.length - 1].count).toBe(1);
      expect(days.slice(0, 6).every((d) => d.count === 0)).toBe(true);
    });
  });

  describe('getCategoryBreakdown', () => {
    it('excludes categories with no tasks', () => {
      const tasks = [makeTask({ category: 'work' })];
      const breakdown = getCategoryBreakdown(tasks);
      expect(breakdown).toEqual([{ category: 'work', total: 1, completed: 0 }]);
    });

    it('counts completed vs total per category', () => {
      const tasks = [
        makeTask({ category: 'health', completed: true }),
        makeTask({ category: 'health', completed: false }),
      ];
      const breakdown = getCategoryBreakdown(tasks);
      expect(breakdown).toEqual([{ category: 'health', total: 2, completed: 1 }]);
    });
  });
});
