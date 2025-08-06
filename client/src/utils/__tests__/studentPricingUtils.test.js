// client/src/utils/__tests__/studentPricingUtils.test.js
import { 
  getStudentPricingDisplay, 
  getPricingTier, 
  calculatePricingBreakdown 
} from '../studentPricingUtils';

describe('studentPricingUtils', () => {
  describe('getStudentPricingDisplay', () => {
    test('handles standard student pricing correctly', () => {
      const student = { 
        monthlyRate: 1400, 
        isLegacyStudent: false 
      };
      
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
      const student = { 
        monthlyRate: 1000, 
        isLegacyStudent: true 
      };
      
      const result = getStudentPricingDisplay(student);
      
      expect(result).toEqual({
        monthly: 1000,
        yearly: 12000,
        monthlyFormatted: '₱1,000',
        yearlyFormatted: '₱12,000',
        isLegacy: true,
        tierLabel: 'Founding'
      });
    });

    test('handles early adopter pricing correctly', () => {
      const student = { 
        monthlyRate: 1200, 
        isLegacyStudent: true 
      };
      
      const result = getStudentPricingDisplay(student);
      
      expect(result.tierLabel).toBe('Early');
      expect(result.isLegacy).toBe(true);
      expect(result.monthlyFormatted).toBe('₱1,200');
    });

    test('handles other legacy pricing correctly', () => {
      const student = { 
        monthlyRate: 1100, 
        isLegacyStudent: true 
      };
      
      const result = getStudentPricingDisplay(student);
      
      expect(result.tierLabel).toBe('Legacy');
      expect(result.isLegacy).toBe(true);
    });

    test('handles null/undefined student gracefully', () => {
      const result = getStudentPricingDisplay(null);
      
      expect(result.monthly).toBe(1400);
      expect(result.tierLabel).toBe('Standard');
      expect(result.isLegacy).toBe(false);
    });

    test('handles student with missing monthlyRate', () => {
      const student = { isLegacyStudent: false };
      
      const result = getStudentPricingDisplay(student);
      
      expect(result.monthly).toBe(1400); // Default rate
      expect(result.monthlyFormatted).toBe('₱1,400');
    });

    test('handles student with missing isLegacyStudent flag', () => {
      const student = { monthlyRate: 1400 };
      
      const result = getStudentPricingDisplay(student);
      
      expect(result.isLegacy).toBe(false);
      expect(result.tierLabel).toBe('Standard');
    });
  });

  describe('getPricingTier', () => {
    test('returns null for standard pricing', () => {
      const student = { 
        monthlyRate: 1400, 
        isLegacyStudent: false 
      };
      
      expect(getPricingTier(student)).toBeNull();
    });

    test('returns founding tier for ₱1,000/month legacy students', () => {
      const student = { 
        monthlyRate: 1000, 
        isLegacyStudent: true 
      };
      
      const result = getPricingTier(student);
      
      expect(result).toEqual({
        label: 'Founding',
        emoji: '🌟',
        color: 'text-purple-400',
        bg: 'bg-purple-500 bg-opacity-20',
        border: 'border-purple-500'
      });
    });

    test('returns early tier for ₱1,200/month legacy students', () => {
      const student = { 
        monthlyRate: 1200, 
        isLegacyStudent: true 
      };
      
      const result = getPricingTier(student);
      
      expect(result.label).toBe('Early');
      expect(result.color).toBe('text-blue-400');
    });

    test('returns legacy tier for other legacy pricing', () => {
      const student = { 
        monthlyRate: 1100, 
        isLegacyStudent: true 
      };
      
      const result = getPricingTier(student);
      
      expect(result.label).toBe('Legacy');
      expect(result.color).toBe('text-yellow-400');
    });

    test('handles null student', () => {
      expect(getPricingTier(null)).toBeNull();
    });

    test('handles undefined student', () => {
      expect(getPricingTier(undefined)).toBeNull();
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

    test('handles null/undefined input', () => {
      expect(calculatePricingBreakdown(null)).toEqual({
        total: 0,
        standard: { count: 0, revenue: 0 },
        founding: { count: 0, revenue: 0 },
        early: { count: 0, revenue: 0 },
        legacy: { count: 0, revenue: 0 }
      });
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
      
      expect(result).toEqual({
        total: 5,
        standard: { count: 2, revenue: 2800 },
        founding: { count: 1, revenue: 1000 },
        early: { count: 1, revenue: 1200 },
        legacy: { count: 1, revenue: 1100 }
      });
    });

    test('handles students with missing pricing information', () => {
      const students = [
        {}, // Missing both fields
        { isLegacyStudent: false }, // Missing monthlyRate
        { monthlyRate: 1000 }, // Missing isLegacyStudent
      ];
      
      const result = calculatePricingBreakdown(students);
      
      expect(result.total).toBe(3);
      expect(result.standard.count).toBe(2); // Default behavior for missing legacy flag
      expect(result.founding.count).toBe(1); // Has 1000 rate but no legacy flag (defaults to false)
    });
  });
});