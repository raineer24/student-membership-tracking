// File: client/src/utils/studentStatusConfig.js
// Lines 1-45: Status configuration for dark theme consistency

/**
 * Dark theme status configuration matching existing design patterns
 * Uses bg-[color]-600 pattern to match current StudentManagementSection styling
 */
export const statusConfig = {
  active: { 
    bg: "bg-green-600", 
    text: "text-white", 
    icon: "✅", 
    label: "Active" 
  },
  expiring: { 
    bg: "bg-yellow-600", 
    text: "text-white", 
    icon: "⚠️", 
    label: "Expiring" 
  },
  overdue: { 
    bg: "bg-red-600", 
    text: "text-white", 
    icon: "🚨", 
    label: "Overdue" 
  },
  inactive: { 
    bg: "bg-gray-600", 
    text: "text-white", 
    icon: "⚫", 
    label: "Inactive" 
  }
};

/**
 * Gets status configuration for a given status
 * @param {string} status - Student status
 * @returns {Object} Status configuration object
 */
export const getStatusConfig = (status) => {
  return statusConfig[status] || statusConfig.inactive;
};

/**
 * Tab configuration for student management filters
 */
export const tabsConfig = [
  { id: "all", label: "All Students" },
  { id: "active", label: "Active" },
  { id: "expiring", label: "Expiring Soon" },
  { id: "overdue", label: "Overdue" },
  { id: "inactive", label: "Inactive" },
];