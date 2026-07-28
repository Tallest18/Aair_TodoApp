import { formatDueDate, isOverdue } from '../src/utils/dateUtils';

describe('dateUtils', () => {
  describe('isOverdue', () => {
    it('returns true for a date before today', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isOverdue(yesterday.toISOString())).toBe(true);
    });

    it('returns false for today', () => {
      const today = new Date();
      expect(isOverdue(today.toISOString())).toBe(false);
    });

    it('returns false for a future date', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(isOverdue(tomorrow.toISOString())).toBe(false);
    });
  });

  describe('formatDueDate', () => {
    it('labels today as "Today"', () => {
      expect(formatDueDate(new Date().toISOString())).toBe('Today');
    });

    it('labels tomorrow as "Tomorrow"', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(formatDueDate(tomorrow.toISOString())).toBe('Tomorrow');
    });

    it('labels yesterday as "Yesterday"', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(formatDueDate(yesterday.toISOString())).toBe('Yesterday');
    });

    it('falls back to a short date for other days', () => {
      const future = new Date();
      future.setDate(future.getDate() + 10);
      const result = formatDueDate(future.toISOString());
      expect(result).not.toBe('Today');
      expect(result).not.toBe('Tomorrow');
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
