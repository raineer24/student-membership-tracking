// File: client/src/components/dashboard/StatisticsCards.jsx
// Lines 1-10: Component for dashboard statistics cards section
// Extracted from DashboardPage.jsx lines 365-500
import React from 'react';

/**
 * StatisticsCards Component
 * Displays key metrics and statistics in card format
 * Follows KISS principle with simple, focused display logic
 * 
 * @param {Object} props - Component props
 * @param {Array} props.students - Array of student data
 * @param {Object} props.dashboardData - Dashboard summary data
 * @param {Object} props.tabCounts - Student counts by status
 * @param {Object} props.pricingBreakdown - Revenue calculations
 */
const StatisticsCards = ({ 
  students = [], 
  dashboardData = {}, 
  tabCounts = {}, 
  pricingBreakdown = {} 
}) => {
  // Lines 15-25: Statistics card configuration
  const statisticsConfig = [
    {
      title: "Total Students",
      value: students?.length || dashboardData?.summary?.totalStudents || 0,
      subtitle: "All registered students",
      icon: "👥",
      colorClass: "text-white"
    },
    {
      title: "Active",
      value: tabCounts.active || 0,
      subtitle: "Currently enrolled", 
      icon: "✅",
      colorClass: "text-green-400"
    },
    {
      title: "Expiring Soon",
      value: tabCounts.expiring || 0,
      subtitle: "Within 7 days",
      icon: "⚠️", 
      colorClass: "text-yellow-400"
    },
    {
      title: "Overdue",
      value: tabCounts.overdue || 0,
      subtitle: "Payment overdue",
      icon: "🚨",
      colorClass: "text-red-400"
    },
    {
      title: "Monthly Revenue", 
      value: `$${pricingBreakdown.totalMonthly?.toLocaleString() || 0}`,
      subtitle: "Expected monthly",
      icon: "💰",
      colorClass: "text-green-400"
    }
  ];

  // Lines 30-90: Main render
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
      {statisticsConfig.map((stat, index) => (
        <div 
          key={index}
          className="bg-gray-800 bg-opacity-90 backdrop-blur-sm overflow-hidden shadow-xl rounded-xl border border-gray-600"
        >
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-3xl">{stat.icon}</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-400 truncate">
                    {stat.title}
                  </dt>
                  <dd className={`text-3xl font-bold ${stat.colorClass}`}>
                    {stat.value}
                  </dd>
                  <dd className="text-sm text-gray-500">
                    {stat.subtitle}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatisticsCards;