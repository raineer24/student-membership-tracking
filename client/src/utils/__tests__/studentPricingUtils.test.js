// client/src/utils/__tests__/studentPricingUtils.test.js
import { describe, test, expect } from 'vitest';
import { 
  getStudentPricingDisplay, 
  getPricingTier, 
  calculatePricingBreakdown 
} from '../studentPricingUtils';

describe('studentPricingUtils', () => {
  describe('getStudentPricingDisplay', () => {
    test('handles standard student pricing correctly', () => {
      const student = { monthlyRate: 1400, isLegacyStudent: false };
      const result = getStudentPricingDisplay(student);
      
      expect(result).toEqual({
        monthly: 1400,
        yearly: 16800,
        monthlyFormatted: '₱1,400',
        yearlyFormatted: '₱16,800',
        isLegacy: false,
        tierLabel: 'Standard'
      });
    });

    test('handles founding member pricing correctly', () => {
      const student = { monthlyRate: 1000, isLegacyStudent: true };
      const result = getStudentPricingDisplay(student);
      
      expect(result.monthly).toBe(1000);
      expect(result.tierLabel).toBe('Founding');
      expect(result.isLegacy).toBe(true);
      expect(result.monthlyFormatted).toBe('₱1,000');
    });

    test('handles early adopter pricing correctly', () => {
      const student = { monthlyRate: 1200, isLegacyStudent: true };
      const result = getStudentPricingDisplay(student);
      
      expect(result.tierLabel).toBe('Early');
      expect(result.monthlyFormatted).toBe('₱1,200');
    });

    test('handles null/undefined student gracefully', () => {
      const result = getStudentPricingDisplay(null);
      
      expect(result.monthly).toBe(1400);
      expect(result.tierLabel).toBe('Standard');
      expect(result.isLegacy).toBe(false);
    });
  });

  describe('getPricingTier', () => {
    test('returns null for standard pricing', () => {
      const student = { monthlyRate: 1400, isLegacyStudent: false };
      expect(getPricingTier(student)).toBeNull();
    });

    test('returns founding tier for ₱1,000/month legacy students', () => {
      const student = { monthlyRate: 1000, isLegacyStudent: true };
      const result = getPricingTier(student);
      
      expect(result.label).toBe('Founding');
      expect(result.color).toBe('text-purple-400');
      expect(result.emoji).toBe('🌟');
    });

    test('returns early tier for ₱1,200/month legacy students', () => {
      const student = { monthlyRate: 1200, isLegacyStudent: true };
      const result = getPricingTier(student);
      
      expect(result.label).toBe('Early');
      expect(result.color).toBe('text-blue-400');
    });

    test('handles null student', () => {
      expect(getPricingTier(null)).toBeNull();
    });
  });

  describe('calculatePricingBreakdown', () => {
    test('handles empty student array', () => {
      const result = calculatePricingBreakdown([]);
      
      expect(result).toEqual({
        total: 0,
        standard: { count: 0, revenue: 0 },
        founding: { count: 0, revenue: 0 },
        early: { count: 0, revenue: 0 },
        legacy: { count: 0, revenue: 0 }
      });
    });

    test('handles null input', () => {
      const result = calculatePricingBreakdown(null);
      expect(result.total).toBe(0);
    });

    test('calculates mixed pricing breakdown correctly', () => {
      const students = [
        { monthlyRate: 1400, isLegacyStudent: false }, // Standard
        { monthlyRate: 1400, isLegacyStudent: false }, // Standard
        { monthlyRate: 1000, isLegacyStudent: true },  // Founding
        { monthlyRate: 1200, isLegacyStudent: true },  // Early
        { monthlyRate: 1100, isLegacyStudent: true },  // Legacy
      ];
      
      const result = calculatePricingBreakdown(students);
      
      expect(result.total).toBe(5);
      expect(result.standard.count).toBe(2);
      expect(result.standard.revenue).toBe(2800);
      expect(result.founding.count).toBe(1);
      expect(result.founding.revenue).toBe(1000);
      expect(result.early.count).toBe(1);
      expect(result.early.revenue).toBe(1200);
      expect(result.legacy.count).toBe(1);
      expect(result.legacy.revenue).toBe(1100);
    });
  });
});