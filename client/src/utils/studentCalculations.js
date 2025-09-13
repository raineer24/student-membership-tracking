// File: client/src/utils/studentCalculations.js
// Lines 1-15: Pure utility functions for student calculations following KISS and DRY principles
// Clear line number guidance for 2-year developer experience level

// Lines 1-35: Revenue calculation function - Direct from students data
export const calculateRevenueData = (students) => {
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

  let totalRevenue = 0;
  let legacyCount = 0;
  let legacyRevenue = 0;
  let standardCount = 0;
  let standardRevenue = 0;

  students.forEach(student => {
    const monthlyRate = student.monthlyRate || student.rate || 1400;
    const isLegacy = student.isLegacyStudent || monthlyRate < 1400;
    
    // Only count active students with completed payments
    const hasActiveMembership = student.memberships && student.memberships.length > 0;
    const latestMembership = hasActiveMembership ? 
      student.memberships.reduce((latest, current) => {
        const currentDate = new Date(current.endDate || current.createdAt);
        const latestDate = new Date(latest.endDate || latest.createdAt);
        return currentDate > latestDate ? current : latest;
      }, student.memberships[0]) : null;

    const isActive = latestMembership && new Date(latestMembership.endDate) > new Date();
    
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
  });

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

// Lines 50-85: Student status calculation - Enhanced with training data
export const calculateStudentStatus = (student) => {
  if (!student?.memberships || student.memberships.length === 0) {
    return 'inactive';
  }

  const latestMembership = student.memberships.reduce((latest, current) => {
    const currentDate = new Date(current.endDate || current.createdAt);
    const latestDate = new Date(latest?.endDate || latest?.createdAt || 0);
    return currentDate > latestDate ? current : latest;
  }, null);

  if (!latestMembership?.endDate) return 'inactive';

  try {
    const endDate = new Date(latestMembership.endDate);
    const today = new Date();
    
    if (isNaN(endDate.getTime()) || isNaN(today.getTime())) return 'inactive';
    
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    
    const timeDiff = endDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    // Enhanced status calculation with training consideration
    if (daysDiff < 0) return 'overdue';
    if (daysDiff <= 7) return 'expiring';
    if (daysDiff <= 30) return 'active';
    return 'active';
  } catch (error) {
    console.warn("Student status calculation error:", error);
    return 'inactive';
  }
};

// Lines 90-115: Safe days remaining calculation - No more NaN errors
export const calculateDaysRemaining = (student) => {
  if (!student?.memberships || student.memberships.length === 0) return 0;
  
  const latestMembership = student.memberships.reduce((latest, current) => {
    const currentDate = new Date(current.endDate || current.createdAt);
    const latestDate = new Date(latest?.endDate || latest?.createdAt || 0);
    return currentDate > latestDate ? current : latest;
  }, null);

  if (!latestMembership?.endDate) return 0;

  try {
    const endDate = new Date(latestMembership.endDate);
    const today = new Date();
    
    if (isNaN(endDate.getTime()) || isNaN(today.getTime())) return 0;
    
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    
    const timeDiff = endDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    return daysDiff;
  } catch (error) {
    console.warn("Date calculation error:", error);
    return 0;
  }
};

// Lines 120-140: SMS eligibility check - Only expiring and overdue students
export const canSendReminder = (student) => {
  const status = calculateStudentStatus(student);
  const hasPhone = Boolean(student.phone || student.phoneNumber);
  
  // Only allow SMS for expiring and overdue students with phone numbers
  return (status === 'expiring' || status === 'overdue') && hasPhone;
};

// Lines 145-185: NEW Training status calculation for 30+ day tracking
export const getTrainingStatus = (student) => {
  if (!student.lastTraining) {
    return { status: "error", color: "red", message: "No training data" };
  }
  
  const today = new Date();
  const lastTraining = new Date(student.lastTraining);
  const daysSince = Math.ceil((today - lastTraining) / (1000 * 60 * 60 * 24));
  
  // New student detection (1-2 sessions after trial)
  if (student.totalSessions <= 2) {
    return { 
      status: "new", 
      color: "blue", 
      message: `New student (${student.totalSessions} sessions)` 
    };
  }
  
  // Training frequency analysis
  if (daysSince > 30) {
    return { 
      status: "inactive", 
      color: "red", 
      message: `${daysSince} days ago` 
    };
  }
  if (daysSince > 21) {
    return { 
      status: "missed3weeks", 
      color: "orange", 
      message: `${daysSince} days ago (3+ weeks)` 
    };
  }
  if (daysSince > 14) {
    return { 
      status: "missed2weeks", 
      color: "yellow", 
      message: `${daysSince} days ago (2+ weeks)` 
    };
  }
  return { 
    status: "active", 
    color: "green", 
    message: `${daysSince} days ago` 
  };
};

// Lines 190-230: NEW Business intelligence insights
export const getStudentInsight = (student) => {
  const payment = calculateStudentStatus(student);
  const training = getTrainingStatus(student);
  
  // New student monitoring
  if (training.status === "new" && payment === "active") {
    return { 
      type: "new-student", 
      priority: "medium", 
      action: "New student - monitor engagement" 
    };
  }
  
  // Revenue protection - paying but not training
  if (payment === "active") {
    if (training.status === "inactive") {
      return { 
        type: "paid-not-training", 
        priority: "high", 
        action: "Contact parent - paying but not attending 30+ days" 
      };
    }
    if (training.status === "missed3weeks") {
      return { 
        type: "paid-missing", 
        priority: "high", 
        action: "Contact parent - missed 3+ weeks" 
      };
    }
    if (training.status === "missed2weeks") {
      return { 
        type: "paid-low-activity", 
        priority: "medium", 
        action: "Check in with parent - missed 2+ weeks" 
      };
    }
  }
  
  return { 
    type: "normal", 
    priority: "low", 
    action: "No action needed" 
  };
};