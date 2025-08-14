// File: client/src/utils/dateUtils.js
// Lines 1-60: Date utility functions with enhanced error handling

/**
 * Formats a due date string for display with appropriate styling
 * @param {string|null} dateString - ISO date string or null
 * @returns {Object} Object with text and color properties for UI display
 */
export const formatDueDate = (dateString) => {
  // Lines 10-12: Handle null/undefined/empty inputs
  if (!dateString) {
    return { text: "N/A", color: "text-gray-400" };
  }
  
  try {
    // Lines 16-20: Parse dates and normalize to start of day
    const endDate = new Date(dateString);
    const today = new Date();
    
    // Validate the parsed date
    if (isNaN(endDate.getTime())) {
      return { text: "Invalid Date", color: "text-red-400" };
    }
    
    // Set both dates to start of day for accurate comparison
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    
    // Lines 25-30: Calculate time difference in days
    const timeDiff = endDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    // Lines 32-50: Return appropriate display based on days difference
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
    // Lines 52-55: Handle parsing errors gracefully
    console.error('Date parsing error:', error);
    return { text: "Invalid Date", color: "text-red-400" };
  }
};

/**
 * Checks if a given date string represents an overdue date
 * @param {string|null} dateString - ISO date string or null
 * @returns {boolean} True if the date is overdue, false otherwise
 */
export const isOverdue = (dateString) => {
  // Lines 65-67: Handle null/undefined inputs
  if (!dateString) {
    return false;
  }
  
  try {
    // Lines 71-75: Parse date and compare with today
    const endDate = new Date(dateString);
    const today = new Date();
    
    // Validate the parsed date
    if (isNaN(endDate.getTime())) {
      return false;
    }
    
    // Set both dates to start of day for accurate comparison
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    
    // Lines 80-82: Return true if end date is before today
    return endDate.getTime() < today.getTime();
  } catch (error) {
    // Lines 84-87: Handle errors gracefully
    console.error('Date validation error:', error);
    return false;
  }
};

/**
 * Gets the number of days until a given date
 * @param {string|null} dateString - ISO date string or null
 * @returns {number|null} Number of days (negative if overdue), null if invalid
 */
export const getDaysUntilDate = (dateString) => {
  // Lines 95-97: Handle null/undefined inputs
  if (!dateString) {
    return null;
  }
  
  try {
    // Lines 101-105: Parse dates and normalize
    const endDate = new Date(dateString);
    const today = new Date();
    
    // Validate the parsed date
    if (isNaN(endDate.getTime())) {
      return null;
    }
    
    // Set both dates to start of day for accurate comparison
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    
    // Lines 110-112: Calculate and return days difference
    const timeDiff = endDate.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  } catch (error) {
    // Lines 114-117: Handle errors gracefully
    console.error('Days calculation error:', error);
    return null;
  }
};

/**
 * Formats a date for display in the UI
 * @param {string|Date} date - Date string or Date object
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date string
 */
export const formatDisplayDate = (date, options = {}) => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (!dateObj || isNaN(dateObj.getTime())) {
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
    console.error('Date formatting error:', error);
    return 'Invalid Date';
  }
};