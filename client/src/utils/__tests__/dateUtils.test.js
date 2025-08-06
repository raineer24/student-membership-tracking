// utils/__tests__/dateUtils.test.js
import { formatDueDate, isOverdue } from '../dateUtils';

describe('dateUtils', () => {
  describe('formatDueDate', () => {
    test('handles null/undefined dates', () => {
      expect(formatDueDate(null)).toEqual({ text: "N/A", color: "text-gray-400" });
      expect(formatDueDate(undefined)).toEqual({ text: "N/A", color: "text-gray-400" });
    });

    test('formats future dates correctly', () => {
      const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
      const result = formatDueDate(futureDate.toISOString());
      expect(result.text).toBe('10 days remaining');
      expect(result.color).toBe('text-green-400');
    });

    test('formats today correctly', () => {
      const today = new Date();
      const result = formatDueDate(today.toISOString());
      expect(result.text).toBe('Due today');
      expect(result.color).toBe('text-orange-400 font-medium');
    });

    test('formats overdue dates correctly', () => {
      const pastDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
      const result = formatDueDate(pastDate.toISOString());
      expect(result.text).toBe('5 days overdue');
      expect(result.color).toBe('text-red-400 font-medium');
    });

    test('handles invalid dates', () => {
      const result = formatDueDate('invalid-date');
      expect(result.text).toBe('Invalid Date');
      expect(result.color).toBe('text-gray-400');
    });
  });

  describe('isOverdue', () => {
    test('returns true for past dates', () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      expect(isOverdue(pastDate.toISOString())).toBe(true);
    });

    test('returns false for future dates', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      expect(isOverdue(futureDate.toISOString())).toBe(false);
    });

    test('handles null/undefined dates', () => {
      expect(isOverdue(null)).toBe(false);
      expect(isOverdue(undefined)).toBe(false);
    });
  });
});