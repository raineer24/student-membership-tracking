// File: client/src/utils/dateUtils.js
// Lines 1-15: Robust date utility functions with comprehensive error handling

/**
 * PRODUCTION-READY Date Utilities
 * Handles all date operations with comprehensive error prevention
 * Eliminates NaN errors and undefined string operations
 */

/**
 * Safely parses a date string and validates the result
 * @param {any} dateInput - Date string, Date object, or any input
 * @returns {Date|null} Valid Date object or null if invalid
 */
export const safeDateParse = (dateInput) => {
  // Handle null/undefined inputs
  if (dateInput === null || dateInput === undefined) {
    return null;
  }
  
  try {
    // Handle existing Date objects
    if (dateInput instanceof Date) {
      return isNaN(dateInput.getTime()) ? null : dateInput;
    }
    
    // Convert to string and validate
    const dateStr = String(dateInput).trim();
    if (!dateStr || dateStr === 'null' || dateStr === 'undefined') {
      return null;
    }
    
    // Parse the date
    const parsedDate = new Date(dateStr);
    
    // Validate the parsed date
    if (isNaN(parsedDate.getTime())) {
      return null;
    }
    
    return parsedDate;
  } catch (error) {
    console.warn('Date parsing error:', error);
    return null;
  }
};

/**
 * Calculates days difference between two dates with comprehensive validation
 * @param {any} endDateInput - End date (string, Date, or any input)
 * @param {any} startDateInput - Start date (optional, defaults to today)
 * @returns {number|null} Days difference or null if invalid
 */
export const calculateDaysDifference = (endDateInput, startDateInput = null) => {
  try {
    // Parse and validate end date
    const endDate = safeDateParse(endDateInput);
    if (!endDate) {
      return null;
    }
    
    // Parse start date (default to today)
    const startDate = startDateInput ? safeDateParse(startDateInput) : new Date();
    if (!startDate) {
      return null;
    }
    
    // Normalize dates to start of day for accurate comparison
    const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    
    // Calculate difference
    const timeDiff = endDateOnly.getTime() - startDateOnly.getTime();
    
    // Validate calculation
    if (isNaN(timeDiff)) {
      return null;
    }
    
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    // Final validation
    return isNaN(daysDiff) ? null : daysDiff;
  } catch (error) {
    console.warn('Days calculation error:', error);
    return null;
  }
};

/**
 * Formats a due date string for display with appropriate styling
 * @param {any} dateInput - Date string, Date object, or any input
 * @returns {Object} Object with text and color properties for UI display
 */
export const formatDueDate = (dateInput) => {
  // Handle null/undefined/empty inputs
  if (!dateInput) {
    return { text: "N/A", color: "text-gray-400" };
  }
  
  try {
    const daysDiff = calculateDaysDifference(dateInput);
    
    // Handle invalid date calculations
    if (daysDiff === null || isNaN(daysDiff)) {
      return { text: "Invalid Date", color: "text-red-400" };
    }
    
    // Return appropriate display based on days difference
    if (daysDiff > 7) {
      return { 
        text: `${daysDiff} days remaining`, 
        color: "text-green-400" 
      };
    } else if (daysDiff > 0) {
      return { 
        text: `${daysDiff} day${daysDiff === 1 ? '' : 's'} remaining`, 
        color: "text-yellow-400" 
      };
    } else if (daysDiff === 0) {
      return { 
        text: "Due today", 
        color: "text-orange-400 font-medium" 
      };
    } else {
      const overdueDays = Math.abs(daysDiff);
      return { 
        text: `${overdueDays} day${overdueDays === 1 ? '' : 's'} overdue`, 
        color: "text-red-400 font-medium" 
      };
    }
  } catch (error) {
    console.warn('Date formatting error:', error);
    return { text: "Error", color: "text-red-400" };
  }
};

/**
 * Checks if a given date represents an overdue date
 * @param {any} dateInput - Date string, Date object, or any input
 * @returns {boolean} True if the date is overdue, false otherwise
 */
export const isOverdue = (dateInput) => {
  try {
    const daysDiff = calculateDaysDifference(dateInput);
    return daysDiff !== null && daysDiff < 0;
  } catch (error) {
    console.warn('Overdue check error:', error);
    return false;
  }
};

/**
 * Gets the number of days until a given date
 * @param {any} dateInput - Date string, Date object, or any input
 * @returns {number|null} Number of days (negative if overdue), null if invalid
 */
export const getDaysUntilDate = (dateInput) => {
  return calculateDaysDifference(dateInput);
};

/**
 * Formats a date for display in the UI
 * @param {any} dateInput - Date string, Date object, or any input
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date string
 */
export const formatDisplayDate = (dateInput, options = {}) => {
  try {
    const dateObj = safeDateParse(dateInput);
    
    if (!dateObj) {
      return 'Invalid Date';
    }
    
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options
    };
    
    return dateObj.toLocaleDateString('en-US', defaultOptions);
  } catch (error) {
    console.warn('Date formatting error:', error);
    return 'Invalid Date';
  }
};

/**
 * Gets student status based on membership end date
 * @param {Object} student - Student object with memberships
 * @returns {string} Status: 'active', 'expiring', 'overdue', or 'inactive'
 */
export const getStudentStatusFromDate = (student) => {
  try {
    // Validate student input
    if (!student || typeof student !== 'object') {
      return 'inactive';
    }

    if (!student.memberships || !Array.isArray(student.memberships) || student.memberships.length === 0) {
      return 'inactive';
    }

    // Get latest membership with enhanced sorting
    const sortedMemberships = [...student.memberships].sort((a, b) => {
      const getDateValue = (membership) => {
        const dateStr = membership.createdAt || membership.endDate || membership.startDate;
        const date = safeDateParse(dateStr);
        return date ? date.getTime() : 0;
      };
      
      return getDateValue(b) - getDateValue(a); // DESC order
    });

    const latestMembership = sortedMemberships[0];
    
    if (!latestMembership || !latestMembership.endDate) {
      return 'inactive';
    }

    // Calculate days difference
    const daysDiff = calculateDaysDifference(latestMembership.endDate);
    
    if (daysDiff === null || isNaN(daysDiff)) {
      return 'inactive';
    }

    // Determine status
    if (daysDiff < 0) {
      return 'overdue';
    }
    if (daysDiff <= 7) {
      return 'expiring';
    }
    
    return 'active';
  } catch (error) {
    console.warn('Status calculation error:', error);
    return 'inactive';
  }
};

/**
 * Gets human-readable days remaining text for a student
 * @param {Object} student - Student object with memberships
 * @returns {string} Human-readable days remaining text
 */
export const getStudentDaysRemaining = (student) => {
  try {
    // Validate student input
    if (!student || typeof student !== 'object') {
      return "No data";
    }

    if (!student.memberships || !Array.isArray(student.memberships) || student.memberships.length === 0) {
      return "No membership";
    }

    // Get latest membership
    const sortedMemberships = [...student.memberships].sort((a, b) => {
      const getDateValue = (membership) => {
        const dateStr = membership.createdAt || membership.endDate || membership.startDate;
        const date = safeDateParse(dateStr);
        return date ? date.getTime() : 0;
      };
      
      return getDateValue(b) - getDateValue(a);
    });

    const latestMembership = sortedMemberships[0];
    
    if (!latestMembership || !latestMembership.endDate) {
      return "No end date";
    }

    // Calculate days difference
    const daysDiff = calculateDaysDifference(latestMembership.endDate);
    
    if (daysDiff === null || isNaN(daysDiff)) {
      return "Invalid date";
    }

    // Format result
    if (daysDiff < 0) {
      const absDays = Math.abs(daysDiff);
      return `Expired ${absDays} day${absDays === 1 ? '' : 's'} ago`;
    }
    if (daysDiff === 0) {
      return "Expires today";
    }
    return `${daysDiff} day${daysDiff === 1 ? '' : 's'} remaining`;
    
  } catch (error) {
    console.warn('Days remaining calculation error:', error);
    return "Calculation error";
  }
};

/**
 * Validates if a student can receive SMS reminders
 * @param {Object} student - Student object
 * @returns {boolean} True if eligible for SMS reminders
 */
export const canStudentReceiveSMS = (student) => {
  try {
    if (!student || typeof student !== 'object') {
      return false;
    }
    
    const status = getStudentStatusFromDate(student);
    const phoneNumber = student.phone || student.phoneNumber;
    const hasPhone = Boolean(phoneNumber && String(phoneNumber).trim().length > 0);
    
    return (status === "expiring" || status === "overdue") && hasPhone;
  } catch (error) {
    console.warn('SMS eligibility check error:', error);
    return false;
  }
};