// File: client/src/utils/studentCalculations.js
// Lines 1-280: Enhanced with Monthly Frequency Calculation
// ADDED: Lines 217-280 - New frequency calculation function

/**
 * Calculate comprehensive revenue data from students array
 * Lines 10-90: Revenue calculation with defensive programming
 * @param {Array} students - Array of student objects with memberships
 * @returns {Object} Complete revenue breakdown and statistics
 */
export const calculateRevenueData = (students) => {
  // Lines 15-28: Early return for edge cases
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

  // Lines 30-36: Initialize revenue tracking variables
  let totalRevenue = 0;
  let legacyCount = 0;
  let legacyRevenue = 0;
  let standardCount = 0;
  let standardRevenue = 0;

  // Lines 38-75: Process each student for revenue calculation
  students.forEach(student => {
    const monthlyRate = student.monthlyRate || student.rate || 1400;
    const isLegacy = student.isLegacyStudent || monthlyRate < 1400;
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

  // Lines 77-90: Return comprehensive revenue object
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
 * Lines 95-155: FIXED - Consistent Math.ceil calculation
 * CRITICAL FIX: Changed Math.round to Math.ceil for consistency with WeekendEventModal
 * This ensures status colors match across all UI components (dashboard, modals, lists)
 * @param {Object} student - Student object with memberships array
 * @returns {string} Status: 'active', 'expiring', 'overdue', 'inactive'
 */
export const calculateStudentStatus = (student) => {
  // Lines 102-105: Handle edge case - no memberships
  if (!student?.memberships || student.memberships.length === 0) {
    return 'inactive';
  }

  // Lines 107-113: Find the latest membership by end date
  const latestMembership = student.memberships.reduce((latest, current) => {
    const currentDate = new Date(current.endDate || current.createdAt);
    const latestDate = new Date(latest?.endDate || latest?.createdAt || 0);
    return currentDate > latestDate ? current : latest;
  }, null);

  // Lines 115-116: Handle missing end date
  if (!latestMembership?.endDate) return 'inactive';

  try {
    // Lines 119-123: Date calculation with error handling
    const endDate = new Date(latestMembership.endDate);
    const today = new Date();
    
    if (isNaN(endDate.getTime()) || isNaN(today.getTime())) return 'inactive';
    
    // Lines 125-127: Normalize dates to midnight for accurate comparison
    const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    // Lines 129-133: CRITICAL FIX - Use Math.ceil for consistency
    // Math.ceil gives "benefit of the doubt" - any fraction of a day counts as full day
    // This matches WeekendEventModal logic (line 520) for consistent status colors
    const timeDiff = endDateOnly.getTime() - todayOnly.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    // Lines 135-139: Return status based on days remaining
    if (daysDiff < 0) return 'overdue';
    if (daysDiff <= 7) return 'expiring';
    return 'active';
  } catch (error) {
    // Lines 141-145: Error handling for date operations
    console.warn("Date calculation error:", error);
    return 'inactive';
  }
};

/**
 * Calculate days remaining for student membership
 * Lines 150-200: FIXED - Consistent Math.ceil calculation
 * CRITICAL FIX: Changed Math.round to Math.ceil for consistency
 * @param {Object} student - Student object with memberships
 * @returns {number} Days remaining (negative if overdue)
 */
export const calculateDaysRemaining = (student) => {
  // Lines 157-159: Handle edge case - no memberships
  if (!student?.memberships || student.memberships.length === 0) return 0;
  
  // Lines 161-167: Find the membership with the latest end date
  const latestMembership = student.memberships.reduce((latest, current) => {
    const currentDate = new Date(current.endDate || current.createdAt);
    const latestDate = new Date(latest?.endDate || latest?.createdAt || 0);
    return currentDate > latestDate ? current : latest;
  }, null);

  // Lines 169-170: Handle missing end date
  if (!latestMembership?.endDate) return 0;

  try {
    // Lines 173-177: Date calculation with error handling
    const endDate = new Date(latestMembership.endDate);
    const today = new Date();
    
    if (isNaN(endDate.getTime()) || isNaN(today.getTime())) return 0;
    
    // Lines 179-181: Normalize dates to midnight for accurate comparison
    const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    // Lines 183-187: CRITICAL FIX - Use Math.ceil for consistency
    // Math.ceil ensures any remaining fraction of a day is counted
    // This matches the status calculation logic above
    const timeDiff = endDateOnly.getTime() - todayOnly.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    return daysDiff;
  } catch (error) {
    // Lines 190-195: Error handling for date operations
    console.warn("Date calculation error:", error);
    return 0;
  }
};

/**
 * Check if student is eligible for SMS reminders
 * Lines 200-215: Unchanged - Boolean logic function
 * @param {Object} student - Student object
 * @returns {boolean} True if can send reminder
 */
export const canSendReminder = (student) => {
  // Lines 206-208: Get current status using our status calculation
  const status = calculateStudentStatus(student);
  
  // Lines 210-211: Check if student has phone number
  const hasPhone = Boolean(student.phone || student.phoneNumber);
  
  // Lines 213-215: Business rule: Only send to expiring/overdue students with phone
  return (status === 'expiring' || status === 'overdue') && hasPhone;
};

/**
 * NEW FUNCTION: Calculate monthly training frequency for a student
 * Lines 217-280: Calculate how many times student trained in last 30 days
 * 
 * Purpose: Help determine if payment request is appropriate based on attendance
 * Business Logic:
 *   - High Engagement (≥12 sessions): ~3x/week - Active student, safe to request payment
 *   - Medium Engagement (6-11 sessions): ~1-2x/week - Regular attendance, reasonable to request
 *   - Low Engagement (1-5 sessions): Rare training - Consider personal follow-up first
 *   - No Engagement (0 sessions): Not training - Requires personal contact
 * 
 * @param {Array} trainingSessions - Array of training session objects with sessionDate and attendanceStatus
 * @param {number} daysWindow - Number of days to look back (default: 30)
 * @returns {Object} Frequency data with count, level, color, emoji, and recommendation
 */
export const calculateMonthlyFrequency = (trainingSessions, daysWindow = 30) => {
  // Lines 232-240: Handle edge cases - no sessions data
  if (!trainingSessions || !Array.isArray(trainingSessions) || trainingSessions.length === 0) {
    return {
      count: 0,
      level: 'none',
      color: 'gray',
      emoji: '⚫',
      label: 'No Training',
      recommendation: 'No training activity in 30 days. Requires personal contact to assess situation.',
      shouldRequest: false
    };
  }

  // Lines 242-252: Calculate date threshold (30 days ago)
  const today = new Date();
  const thresholdDate = new Date();
  thresholdDate.setDate(today.getDate() - daysWindow);
  
  // Filter sessions from last 30 days that count as attendance
  // Only count PRESENT and LATE (not ABSENT or LEFT_EARLY)
  const recentValidSessions = trainingSessions.filter(session => {
    if (!session || !session.sessionDate) return false;
    
    const sessionDate = new Date(session.sessionDate);
    if (isNaN(sessionDate.getTime())) return false;
    
    // Only count sessions that actually happened (PRESENT or LATE)
    const validStatuses = ['PRESENT', 'LATE'];
    const isValidStatus = validStatuses.includes(session.attendanceStatus);
    
    return sessionDate >= thresholdDate && isValidStatus;
  });

  // Lines 254-280: Categorize engagement level and provide guidance
  const sessionCount = recentValidSessions.length;

  // High engagement: Training 3+ times per week
  if (sessionCount >= 12) {
    return {
      count: sessionCount,
      level: 'high',
      color: 'green',
      emoji: '🟢',
      label: 'High Engagement',
      recommendation: 'Student trains frequently (3+ times/week). Proceed with payment request confidently.',
      shouldRequest: true
    };
  }

  // Medium engagement: Training 1-2 times per week
  if (sessionCount >= 6) {
    return {
      count: sessionCount,
      level: 'medium',
      color: 'yellow',
      emoji: '🟡',
      label: 'Medium Engagement',
      recommendation: 'Student trains regularly (1-2 times/week). Payment request is reasonable.',
      shouldRequest: true
    };
  }

  // Low engagement: Training rarely (less than once per week)
  if (sessionCount >= 1) {
    return {
      count: sessionCount,
      level: 'low',
      color: 'red',
      emoji: '🔴',
      label: 'Low Engagement',
      recommendation: 'Student trains rarely. Consider personal follow-up to check if everything is okay before requesting payment.',
      shouldRequest: 'with_caution'
    };
  }

  // No engagement: Not training at all
  return {
    count: 0,
    level: 'none',
    color: 'gray',
    emoji: '⚫',
    label: 'No Training',
    recommendation: 'No training activity in 30 days. Requires personal contact to assess situation before payment request.',
    shouldRequest: false
  };
};