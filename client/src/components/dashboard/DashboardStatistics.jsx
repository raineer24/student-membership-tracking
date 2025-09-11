// File: client/src/components/dashboard/DashboardStatistics.jsx
// Lines 1-80: Enhanced Dark Theme Statistics Component with Horizontal Layout
import React from "react";

// Lines 10-80: Statistics Cards Component with Mobile-First Design
const DashboardStatistics = ({ dashboardData, students, tabCounts, pricingBreakdown }) => {
  // Build statistics data array with proper fallbacks
  const statisticsData = [
    {
      title: "Total Students",
      value: students?.length || 0,
      subtitle: "All registered students",
      icon: "👥",
      bgColor: "bg-gray-800",
      iconColor: "text-blue-400"
    },
    {
      title: "Active",
      value: tabCounts?.active || 0,
      subtitle: "Currently enrolled",
      icon: "✅",
      bgColor: "bg-gray-800",
      iconColor: "text-green-400"
    },
    {
      title: "Expiring Soon",
      value: tabCounts?.expiring || 0,
      subtitle: "Within 7 days",
      icon: "⚠️",
      bgColor: "bg-gray-800",
      iconColor: "text-yellow-400"
    },
    {
      title: "Overdue",
      value: tabCounts?.overdue || 0,
      subtitle: "Payment overdue",
      icon: "🚨",
      bgColor: "bg-gray-800",
      iconColor: "text-red-400"
    },
    {
      title: "Monthly Revenue",
      value: `₱${(pricingBreakdown?.totalRevenue || 0).toLocaleString()}`,
      subtitle: "Expected monthly",
      icon: "💰",
      bgColor: "bg-gray-800",
      iconColor: "text-green-400"
    }
  ];

  return (
    <div className="mb-8">
      {/* Statistics Cards - Horizontal layout matching design requirements */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {statisticsData.map((stat, index) => (
          <div 
            key={`stat-${index}`}
            className={`${stat.bgColor} rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors`}
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className={`text-2xl ${stat.iconColor}`}>{stat.icon}</span>
              </div>
              <div className="ml-4 flex-1">
                <div className="flex items-baseline">
                  <p className="text-2xl font-semibold text-white">{stat.value}</p>
                </div>
                <p className="text-sm font-medium text-gray-300">{stat.title}</p>
                <p className="text-xs text-gray-500">{stat.subtitle}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardStatistics;