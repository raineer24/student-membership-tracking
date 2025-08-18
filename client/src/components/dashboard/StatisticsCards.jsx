// File: client/src/components/dashboard/StatisticsCards.jsx
import React from 'react';

const StatisticsCards = ({ 
  students = [], 
  dashboardData = {}, 
  tabCounts = {}, 
  pricingBreakdown = {} 
}) => {
  // FIXED: Ensure tabCounts is always an object with default values
  const safeTabCounts = {
    all: 0,
    active: 0,
    expiring: 0,
    overdue: 0,
    inactive: 0,
    ...tabCounts
  };

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
      value: safeTabCounts.active,
      subtitle: "Currently enrolled", 
      icon: "✅",
      colorClass: "text-green-400"
    },
    {
      title: "Expiring Soon",
      value: safeTabCounts.expiring,
      subtitle: "Within 7 days",
      icon: "⚠️", 
      colorClass: "text-yellow-400"
    },
    {
      title: "Overdue",
      value: safeTabCounts.overdue,
      subtitle: "Payment overdue",
      icon: "🚨",
      colorClass: "text-red-400"
    },
    {
      title: "Monthly Revenue", 
      value: `₱${pricingBreakdown.totalMonthly?.toLocaleString() || 0}`,
      subtitle: "Expected monthly",
      icon: "💰",
      colorClass: "text-green-400"
    }
  ];

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