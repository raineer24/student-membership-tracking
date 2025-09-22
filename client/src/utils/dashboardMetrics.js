// File: client/src/utils/dashboardMetrics.js
// Lines 1-20: Pure calculation function for dashboard metrics
// Clear line guidance: Extract metrics calculation logic

/**
 * Calculates dashboard metrics from student data
 * @param {Array} students - Validated student array
 * @param {Object} tabCounts - Count data by status tabs
 * @param {Object} pricingBreakdown - Revenue breakdown data
 * @returns {Object} - Calculated dashboard metrics
 */
export const calculateDashboardMetrics = (students, tabCounts, pricingBreakdown) => ({
  // Lines 11-17: Pure calculations with fallback values
  totalStudents: Array.isArray(students) ? students.length : 0,
  activeStudents: tabCounts?.active || 0,
  expiringStudents: tabCounts?.expiring || 0,
  overdueStudents: tabCounts?.overdue || 0,
  inactiveStudents: tabCounts?.inactive || 0,
  monthlyRevenue: pricingBreakdown?.totalMonthly || 0
});