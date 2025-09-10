// File: client/src/utils/studentCalculations.js
// Lines 1-150: Zero-risk pure function extractions from DashboardPage.jsx
// Created: Phase 1 - Business logic utilities with no side effects
// Risk Level: 0% - Copy-only operations, deterministic functions

/**
 * Calculate comprehensive revenue data from students array
 * Lines 26-90 extracted from DashboardPage.jsx
 * ZERO RISK: Pure function, no side effects, deterministic output
 * @param {Array} students - Array of student objects with memberships
 * @returns {Object} Complete revenue breakdown and statistics
 */
export const calculateRevenueData = (students) => {
  // Early return for edge cases - defensive programming
  if (!students || students.length === 0) {
    return {
      totalRevenue: 0,
      totalMonthly: 0,
      total: 0,
      legacy: 0,
      legacyRevenue: 0,
      current: 0,
      currentRevenue: 0,
      breakdown: []
    };
  }

  // Initialize revenue tracking variables
  let totalRevenue = 0;
  let legacyCount = 0;
  let legacyRevenue = 0;
  let standardCount = 0;
  let standardRevenue = 0;

  // Process each student for revenue calculation
  students.forEach(student => {
    // Determine monthly rate with fallback logic
    const monthlyRate = student.monthlyRate || student.rate || 1400;
    const isLegacy = student.isLegacyStudent || monthlyRate < 1400;
    
    // Validate membership existence and activity
    const hasActiveMembership = student.memberships && student.memberships.length > 0;
    
    if (hasActiveMembership) {
      // Find the most recent membership
      const latestMembership = student.memberships.reduce((latest, current) => {
        const currentDate = new Date(current.endDate || current.createdAt);
        const latestDate = new Date(latest.endDate || latest.createdAt);
        return currentDate > latestDate ? current : latest;
      }, student.memberships[0]);

      // Check if membership is currently active
      const isActive = latestMembership && 
        latestMembership.endDate && 
        new Date(latestMembership.endDate) > new Date();
      
      // Add to revenue calculations only for active students
      if (isActive) {
        totalRevenue += monthlyRate;
        
        if (isLegacy) {
          legacyCount++;
          legacyRevenue += monthlyRate;
        } else {
          standardCount++;
          standardRevenue += monthlyRate;
        }
      }
    }
  });

  // Return comprehensive revenue object
  return {
    totalRevenue,
    totalMonthly: totalRevenue,
    total: students.length,
    legacy: legacyCount,
    legacyRevenue,
    current: standardCount,
    currentRevenue: standardRevenue,
    breakdown: [
      { type: 'legacy', count: legacyCount, revenue: legacyRevenue },
      { type: 'standard', count: standardCount, revenue: standardRevenue }
    ]
  };
};

/**
 * Calculate student membership status based on end date
 * Lines 95-135 extracted from DashboardPage.jsx
 * ZERO RISK: Pure function, no external dependencies
 * @param {Object} student - Student object with memberships array
 * @returns {string} Status: 'active', 'expiring', 'overdue', 'inactive'
 */
export const calculateStudentStatus = (student) => {
  // Handle edge case - no memberships
  if (!student?.memberships || student.memberships.length === 0) {
    return 'inactive';
  }

  // Find the latest membership by end date
  const latestMembership = student.memberships.reduce((latest, current) => {
    const currentDate = new Date(current.endDate || current.createdAt);
    const latestDate = new Date(latest?.endDate || latest?.createdAt || 0);
    return currentDate > latestDate ? current : latest;
  }, null);

  // Handle missing end date
  if (!latestMembership?.endDate) return 'inactive';

  try {
    // Date calculation with error handling
    const endDate = new Date(latestMembership.endDate);
    const today = new Date();
    
    // Validate date objects
    if (isNaN(endDate.getTime()) || isNaN(today.getTime())) return 'inactive';
    
    // Normalize dates to midnight for accurate comparison
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    
    // Calculate difference in days
    const timeDiff = endDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    // Return status based on days remaining
    if (daysDiff < 0) return 'overdue';
    if (daysDiff <= 7) return 'expiring';
    return 'active';
  } catch (error) {
    // Error handling for date operations
    console.warn("Date calculation error:", error);
    return 'inactive';
  }
};

/**
 * Calculate days remaining for student membership
 * Lines 140-175 extracted from DashboardPage.jsx
 * ZERO RISK: Mathematical operation, no side effects
 * @param {Object} student - Student object with memberships
 * @returns {number} Days remaining (negative if overdue)
 */
export const calculateDaysRemaining = (student) => {
  // Handle edge case - no memberships
  if (!student?.memberships || student.memberships.length === 0) return 0;
  
  // Find the membership with the latest end date
  const latestMembership = student.memberships.reduce((latest, current) => {
    const currentDate = new Date(current.endDate || current.createdAt);
    const latestDate = new Date(latest?.endDate || latest?.createdAt || 0);
    return currentDate > latestDate ? current : latest;
  }, null);

  // Handle missing end date
  if (!latestMembership?.endDate) return 0;

  try {
    // Date calculation with error handling
    const endDate = new Date(latestMembership.endDate);
    const today = new Date();
    
    // Validate date objects
    if (isNaN(endDate.getTime()) || isNaN(today.getTime())) return 0;
    
    // Normalize dates to midnight for accurate comparison
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    
    // Calculate and return difference in days
    const timeDiff = endDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    return daysDiff;
  } catch (error) {
    // Error handling for date operations
    console.warn("Date calculation error:", error);
    return 0;
  }
};

/**
 * Check if student is eligible for SMS reminders
 * Lines 180-190 extracted from DashboardPage.jsx  
 * ZERO RISK: Boolean logic function, no side effects
 * @param {Object} student - Student object
 * @returns {boolean} True if can send reminder
 */
export const canSendReminder = (student) => {
  // Get current status using our status calculation
  const status = calculateStudentStatus(student);
  
  // Check if student has phone number
  const hasPhone = Boolean(student.phone || student.phoneNumber);
  
  // Business rule: Only send to expiring/overdue students with phone
  return (status === 'expiring' || status === 'overdue') && hasPhone;
};