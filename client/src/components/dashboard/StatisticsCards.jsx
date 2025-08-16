// File: client/src/components/dashboard/StatisticsCards.jsx
import React from 'react';

const StatisticsCards = ({ students = [], dashboardData = {}, tabCounts = {}, pricingBreakdown = {} }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-white text-lg">Total Students</h3>
        <p className="text-2xl font-bold text-blue-400">{students.length}</p>
      </div>
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-white text-lg">Monthly Revenue</h3>
        <p className="text-2xl font-bold text-green-400">₱{(pricingBreakdown.totalMonthly || 0).toLocaleString()}</p>
      </div>
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-white text-lg">Active</h3>
        <p className="text-2xl font-bold text-green-400">{tabCounts.active || 0}</p>
      </div>
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-white text-lg">Needs Attention</h3>
        <p className="text-2xl font-bold text-red-400">{(tabCounts.overdue || 0) + (tabCounts.expiring || 0)}</p>
      </div>
    </div>
  );
};

export default StatisticsCards;