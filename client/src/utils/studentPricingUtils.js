// client/src/utils/studentPricingUtils.js
/**
 * Gets formatted pricing display information for a student
 * @param {Object} student - Student object with pricing information
 * @returns {Object} Pricing display object with formatted values
 */
export const getStudentPricingDisplay = (student) => {
  const monthlyRate = student?.monthlyRate || 1400;
  const yearlyRate = monthlyRate * 12;
  const isLegacy = student?.isLegacyStudent || false;
  
  let tierLabel = "Standard";
  if (isLegacy) {
    if (monthlyRate === 1000) tierLabel = "Founding";
    else if (monthlyRate === 1200) tierLabel = "Early";
    else tierLabel = "Legacy";
  }
  
  return {
    monthly: monthlyRate,
    yearly: yearlyRate,
    monthlyFormatted: `₱${monthlyRate.toLocaleString()}`,
    yearlyFormatted: `₱${yearlyRate.toLocaleString()}`,
    isLegacy: isLegacy,
    tierLabel: tierLabel
  };
};

/**
 * Gets pricing tier styling information for a student
 * @param {Object} student - Student object
 * @returns {Object|null} Tier styling object or null for standard pricing
 */
export const getPricingTier = (student) => {
  if (!student) return null;
  
  const monthlyRate = student.monthlyRate || 1400;
  const isLegacy = student.isLegacyStudent || false;
  
  if (!isLegacy) return null;
  
  if (monthlyRate === 1000) {
    return { 
      label: "Founding", 
      emoji: "🌟", 
      color: "text-purple-400",
      bg: "bg-purple-500 bg-opacity-20",
      border: "border-purple-500"
    };
  }
  
  if (monthlyRate === 1200) {
    return { 
      label: "Early", 
      emoji: "🌟", 
      color: "text-blue-400",
      bg: "bg-blue-500 bg-opacity-20",
      border: "border-blue-500"
    };
  }
  
  return { 
    label: "Legacy", 
    emoji: "🌟", 
    color: "text-yellow-400",
    bg: "bg-yellow-500 bg-opacity-20",
    border: "border-yellow-500"
  };
};

/**
 * Calculates pricing breakdown by tier for dashboard statistics
 * @param {Array} students - Array of student objects
 * @returns {Object} Pricing breakdown statistics
 */
export const calculatePricingBreakdown = (students) => {
  if (!Array.isArray(students) || students.length === 0) {
    return {
      total: 0,
      standard: { count: 0, revenue: 0 },
      founding: { count: 0, revenue: 0 },
      early: { count: 0, revenue: 0 },
      legacy: { count: 0, revenue: 0 }
    };
  }

  const breakdown = {
    total: students.length,
    standard: { count: 0, revenue: 0 },
    founding: { count: 0, revenue: 0 },
    early: { count: 0, revenue: 0 },
    legacy: { count: 0, revenue: 0 }
  };

  students.forEach(student => {
    const monthlyRate = student.monthlyRate || 1400;
    const isLegacy = student.isLegacyStudent || false;

    if (!isLegacy) {
      breakdown.standard.count++;
      breakdown.standard.revenue += monthlyRate;
    } else if (monthlyRate === 1000) {
      breakdown.founding.count++;
      breakdown.founding.revenue += monthlyRate;
    } else if (monthlyRate === 1200) {
      breakdown.early.count++;
      breakdown.early.revenue += monthlyRate;
    } else {
      breakdown.legacy.count++;
      breakdown.legacy.revenue += monthlyRate;
    }
  });

  return breakdown;
};