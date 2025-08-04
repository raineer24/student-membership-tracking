// utils/dateUtils.js - Lines 249-279 extracted
/**
 * Formats a date string to display due date information with appropriate styling
 * @param {string} dateString - ISO date string 
 * @returns {Object} Object with text and color properties
 */
export const formatDueDate = (dateString) => {
  if (!dateString) return { text: "N/A", color: "text-gray-400" };
  
  try {
    const endDate = new Date(dateString);
    const today = new Date();
    
    // Reset time to compare dates only
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    
    const timeDiff = endDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    if (daysDiff > 7) {
      return { text: `${daysDiff} days remaining`, color: "text-green-400" };
    } else if (daysDiff > 0) {
      return { text: `${daysDiff} day${daysDiff === 1 ? '' : 's'} remaining`, color: "text-yellow-400" };
    } else if (daysDiff === 0) {
      return { text: "Due today", color: "text-orange-400 font-medium" };
    } else {
      const overdueDays = Math.abs(daysDiff);
      return { text: `${overdueDays} day${overdueDays === 1 ? '' : 's'} overdue`, color: "text-red-400 font-medium" };
    }
  } catch (error) {
    console.error('Date formatting error:', error);
    return { text: "Invalid Date", color: "text-gray-400" };
  }
};

/**
 * Checks if a date is overdue
 * @param {string} dateString - ISO date string
 * @returns {boolean} True if the date is overdue
 */
export const isOverdue = (dateString) => {
  if (!dateString) return false;
  
  try {
    const endDate = new Date(dateString);
    const today = new Date();
    
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    
    return endDate.getTime() < today.getTime();
  } catch {
    return false;
  }
};