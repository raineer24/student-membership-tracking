// File: client/src/utils/studentPricingUtils.js
// Updated: January 8, 2026 - All students standardized to ₱1,500
// Removed: Legacy pricing tiers (₱1,000, ₱1,200, ₱1,400)

const STANDARD_MONTHLY = 1500;
const STANDARD_YEARLY = 18000;

/**
 * Gets formatted pricing display information for a student
 * Line 10: All students now return standard ₱1,500 pricing
 */
export const getStudentPricingDisplay = (student) => {
  return {
    monthly: STANDARD_MONTHLY,
    yearly: STANDARD_YEARLY,
    monthlyFormatted: `₱${STANDARD_MONTHLY.toLocaleString()}`,
    yearlyFormatted: `₱${STANDARD_YEARLY.toLocaleString()}`,
    isLegacy: false,
    tierLabel: "Standard"
  };
};

/**
 * Gets pricing tier styling information for a student
 * Line 24: Always returns null (badges hidden)
 */
export const getPricingTier = (student) => {
  return null; // Badges hidden - all students standard
};

/**
 * Calculates pricing breakdown by tier for dashboard statistics
 * Line 32: Simplified calculation (no legacy tiers)
 */
export const calculatePricingBreakdown = (students) => {
  if (!Array.isArray(students) || students.length === 0) {
    return {
      total: 0,
      legacy: 0,
      current: 0,
      legacyRevenue: 0,
      currentRevenue: 0,
      totalMonthly: 0,
      averageRate: STANDARD_MONTHLY,
      foundingMembers: 0,
      earlyMembers: 0,
      standardMembers: 0
    };
  }
  
  const total = students.length;
  const totalMonthly = total * STANDARD_MONTHLY;
  
  return {
    total,
    legacy: 0,
    current: total,
    legacyRevenue: 0,
    currentRevenue: totalMonthly,
    totalMonthly,
    averageRate: STANDARD_MONTHLY,
    foundingMembers: 0,
    earlyMembers: 0,
    standardMembers: total,
    
    // Additional calculated metrics
    legacyPercentage: 0,
    currentPercentage: 100,
    revenuePerLegacy: 0,
    revenuePerCurrent: STANDARD_MONTHLY,
    
    // Yearly projections
    yearlyRevenue: totalMonthly * 12,
    legacyYearlyRevenue: 0,
    currentYearlyRevenue: totalMonthly * 12
  };
};

/**
 * Gets the monthly rate for a specific pricing tier
 * Line 79: All tiers return standard rate
 */
export const getTierRate = (tier) => {
  return STANDARD_MONTHLY;
};

/**
 * Calculates potential revenue if all students were at standard rate
 * Line 87: No difference since all are standard
 */
export const calculateRevenueComparison = (students) => {
  const totalMonthly = students.length * STANDARD_MONTHLY;
  
  return {
    potential: {
      monthly: totalMonthly,
      yearly: totalMonthly * 12
    },
    actual: {
      monthly: totalMonthly,
      yearly: totalMonthly * 12
    },
    difference: {
      monthly: 0,
      yearly: 0,
      percentage: 0
    }
  };
};