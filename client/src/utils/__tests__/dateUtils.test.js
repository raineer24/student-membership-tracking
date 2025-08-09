// client/src/utils/__tests__/dateUtils.test.js
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { formatDueDate, isOverdue } from '../dateUtils';

describe('dateUtils', () => {
  const mockDate = new Date('2024-08-05T12:00:00.000Z');
  
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('formatDueDate', () => {
    test('handles null/undefined dates correctly', () => {
      expect(formatDueDate(null)).toEqual({ 
        text: "N/A", 
        color: "text-gray-400" 
      });
      
      expect(formatDueDate(undefined)).toEqual({ 
        text: "N/A", 
        color: "text-gray-400" 
      });
    });

    test('formats future dates correctly (more than 7 days)', () => {
      const futureDate = new Date('2024-08-15T12:00:00.000Z');
      const result = formatDueDate(futureDate.toISOString());
      
      expect(result.text).toBe('10 days remaining');
      expect(result.color).toBe('text-green-400');
    });

    test('formats near future dates correctly (1-7 days)', () => {
      const nearFutureDate = new Date('2024-08-08T12:00:00.000Z');
      const result = formatDueDate(nearFutureDate.toISOString());
      
      expect(result.text).toBe('3 days remaining');
      expect(result.color).toBe('text-yellow-400');
    });

    test('formats due today correctly', () => {
      const todayDate = new Date('2024-08-05T15:00:00.000Z');
      const result = formatDueDate(todayDate.toISOString());
      
      expect(result.text).toBe('Due today');
      expect(result.color).toBe('text-orange-400 font-medium');
    });

    test('formats overdue dates correctly', () => {
      const pastDate = new Date('2024-08-01T12:00:00.000Z');
      const result = formatDueDate(pastDate.toISOString());
      
      expect(result.text).toBe('4 days overdue');
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
      const pastDate = new Date('2024-08-04T12:00:00.000Z');
      expect(isOverdue(pastDate.toISOString())).toBe(true);
    });

    test('returns false for future dates', () => {
      const futureDate = new Date('2024-08-06T12:00:00.000Z');
      expect(isOverdue(futureDate.toISOString())).toBe(false);
    });

    test('returns false for today', () => {
      const todayDate = new Date('2024-08-05T15:00:00.000Z');
      expect(isOverdue(todayDate.toISOString())).toBe(false);
    });

    test('handles null/undefined dates', () => {
      expect(isOverdue(null)).toBe(false);
      expect(isOverdue(undefined)).toBe(false);
    });
  });
});