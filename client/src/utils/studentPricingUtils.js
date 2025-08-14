// File: client/src/utils/studentPricingUtils.js
// Lines 1-150: Student pricing utility functions with enhanced calculations

/**
 * Gets formatted pricing display information for a student
 * @param {Object} student - Student object with pricing information
 * @returns {Object} Pricing display object with formatted values
 */
export const getStudentPricingDisplay = (student) => {
  // Lines 10-15: Default values and data extraction
  const monthlyRate = student?.monthlyRate || 1400;
  const yearlyRate = monthlyRate * 12;
  const isLegacy = student?.isLegacyStudent || false;
  
  // Lines 17-25: Tier label determination with enhanced logic
  let tierLabel = "Standard";
  if (isLegacy) {
    if (monthlyRate === 1000) {
      tierLabel = "Founding";
    } else if (monthlyRate === 1200) {
      tierLabel = "Early";
    } else {
      tierLabel = "Legacy";
    }
  }
  
  // Lines 27-38: Return formatted pricing object
  return {
    monthly: monthlyRate,
    yearly: yearlyRate,
    monthlyFormatted: `₱${monthlyRate.toLocaleString()}`,
    yearlyFormatted: `₱${yearlyRate.toLocaleString()}`,
    isLegacy: isLegacy,
    tierLabel: tierLabel,
    discount: isLegacy ? ((1400 - monthlyRate) / 1400 * 100).toFixed(0) : 0,
    savings: isLegacy ? 1400 - monthlyRate : 0
  };
};

/**
 * Gets pricing tier styling information for a student
 * @param {Object} student - Student object
 * @returns {Object|null} Tier styling object or null for standard pricing
 */
export const getPricingTier = (student) => {
  // Lines 45-47: Input validation
  if (!student) return null;
  
  const monthlyRate = student.monthlyRate || 1400;
  const isLegacy = student.isLegacyStudent || false;
  
  // Lines 51-53: Return null for standard pricing
  if (!isLegacy) return null;
  
  // Lines 55-85: Tier-specific styling configurations
  if (monthlyRate === 1000) {
    return { 
      label: "Founding", 
      emoji: "🌟", 
      color: "text-purple-400",
      bg: "bg-purple-500 bg-opacity-20",
      border: "border-purple-500",
      description: "Original founding member"
    };
  }
  
  if (monthlyRate === 1200) {
    return { 
      label: "Early", 
      emoji: "🌟", 
      color: "text-blue-400",
      bg: "bg-blue-500 bg-opacity-20",
      border: "border-blue-500",
      description: "Early adopter pricing"
    };
  }
  
  // Lines 75-85: Default legacy pricing
  return { 
    label: "Legacy", 
    emoji: "🌟", 
    color: "text-yellow-400",
    bg: "bg-yellow-500 bg-opacity-20",
    border: "border-yellow-500",
    description: "Legacy member pricing"
  };
};

/**
 * Calculates pricing breakdown by tier for dashboard statistics
 * @param {Array} students - Array of student objects
 * @returns {Object} Pricing breakdown statistics
 */
export const calculatePricingBreakdown = (students) => {
  // Lines 95-100: Input validation
  if (!Array.isArray(students) || students.length === 0) {
    return {
      total: 0,
      legacy: 0,
      current: 0,
      legacyRevenue: 0,
      currentRevenue: 0,
      totalMonthly: 0,
      averageRate: 0,
      foundingMembers: 0,
      earlyMembers: 0,
      standardMembers: 0
    };
  }
  
  // Lines 105-120: Initialize counters and calculate breakdown
  let legacy = 0;
  let current = 0;
  let legacyRevenue = 0;
  let currentRevenue = 0;
  let foundingMembers = 0;
  let earlyMembers = 0;
  
  students.forEach(student => {
    const monthlyRate = student?.monthlyRate || 1400;
    const isLegacy = student?.isLegacyStudent || false;
    
    if (isLegacy) {
      legacy += 1;
      legacyRevenue += monthlyRate;
      
      // Count specific legacy tiers
      if (monthlyRate === 1000) {
        foundingMembers += 1;
      } else if (monthlyRate === 1200) {
        earlyMembers += 1;
      }
    } else {
      current += 1;
      currentRevenue += monthlyRate;
    }
  });
  
  // Lines 125-150: Calculate totals and return comprehensive breakdown
  const totalMonthly = legacyRevenue + currentRevenue;
  const total = students.length;
  const averageRate = total > 0 ? totalMonthly / total : 0;
  const standardMembers = current;
  
  return {
    total,
    legacy,
    current,
    legacyRevenue,
    currentRevenue,
    totalMonthly,
    averageRate: Math.round(averageRate),
    foundingMembers,
    earlyMembers,
    standardMembers,
    
    // Additional calculated metrics
    legacyPercentage: total > 0 ? ((legacy / total) * 100).toFixed(1) : 0,
    currentPercentage: total > 0 ? ((current / total) * 100).toFixed(1) : 0,
    revenuePerLegacy: legacy > 0 ? Math.round(legacyRevenue / legacy) : 0,
    revenuePerCurrent: current > 0 ? Math.round(currentRevenue / current) : 0,
    
    // Yearly projections
    yearlyRevenue: totalMonthly * 12,
    legacyYearlyRevenue: legacyRevenue * 12,
    currentYearlyRevenue: currentRevenue * 12
  };
};

/**
 * Gets the monthly rate for a specific pricing tier
 * @param {string} tier - Pricing tier (founding, early, legacy, standard)
 * @returns {number} Monthly rate for the tier
 */
export const getTierRate = (tier) => {
  const rates = {
    founding: 1000,
    early: 1200,
    legacy: 1300, // Default legacy rate
    standard: 1400
  };
  
  return rates[tier?.toLowerCase()] || rates.standard;
};

/**
 * Calculates potential revenue if all students were at standard rate
 * @param {Array} students - Array of student objects
 * @returns {Object} Revenue comparison object
 */
export const calculateRevenueComparison = (students) => {
  const breakdown = calculatePricingBreakdown(students);
  const potentialMonthlyRevenue = students.length * 1400;
  const actualMonthlyRevenue = breakdown.totalMonthly;
  const monthlyDifference = potentialMonthlyRevenue - actualMonthlyRevenue;
  
  return {
    potential: {
      monthly: potentialMonthlyRevenue,
      yearly: potentialMonthlyRevenue * 12
    },
    actual: {
      monthly: actualMonthlyRevenue,
      yearly: actualMonthlyRevenue * 12
    },
    difference: {
      monthly: monthlyDifference,
      yearly: monthlyDifference * 12,
      percentage: potentialMonthlyRevenue > 0 ? 
        ((monthlyDifference / potentialMonthlyRevenue) * 100).toFixed(1) : 0
    }
  };
};