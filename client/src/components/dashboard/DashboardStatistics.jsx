// File: client/src/components/dashboard/DashboardStatistics.jsx
// This component must be created to see the UI changes

import React from "react";

const DashboardStatistics = ({ dashboardData, students, tabCounts, pricingBreakdown }) => {
  // Calculate training-related metrics (mock data for now since training sessions aren't implemented yet)
  const trainingMetrics = {
    newStudents: 3,
    activeTraining: 15,
    missed3Weeks: 2,
    inactive30Days: 1
  };

  return (
    <div className="space-y-8">
      {/* Existing Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Total Students */}
        <div className="bg-slate-700 rounded-lg p-6 border border-gray-700 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">👥</span>
                <div>
                  <p className="text-sm font-medium text-gray-300">Total Students</p>
                  <p className="text-2xl font-bold text-white">{students?.length || 0}</p>
                </div>
              </div>
              <p className="text-sm text-gray-400 mt-2">All registered students</p>
            </div>
          </div>
        </div>

        {/* Active */}
        <div className="bg-green-700 rounded-lg p-6 border border-gray-700 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="text-sm font-medium text-gray-300">Active</p>
                  <p className="text-2xl font-bold text-white">{tabCounts?.active || 0}</p>
                </div>
              </div>
              <p className="text-sm text-gray-400 mt-2">Currently enrolled</p>
            </div>
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="bg-yellow-700 rounded-lg p-6 border border-gray-700 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="text-sm font-medium text-gray-300">Expiring Soon</p>
                  <p className="text-2xl font-bold text-white">{tabCounts?.expiring || 0}</p>
                </div>
              </div>
              <p className="text-sm text-gray-400 mt-2">Within 7 days</p>
            </div>
          </div>
        </div>

        {/* Overdue */}
        <div className="bg-red-700 rounded-lg p-6 border border-gray-700 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🚨</span>
                <div>
                  <p className="text-sm font-medium text-gray-300">Overdue</p>
                  <p className="text-2xl font-bold text-white">{tabCounts?.overdue || 0}</p>
                </div>
              </div>
              <p className="text-sm text-gray-400 mt-2">Payment overdue</p>
            </div>
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="bg-green-800 rounded-lg p-6 border border-gray-700 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">💰</span>
                <div>
                  <p className="text-sm font-medium text-gray-300">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-white">₱{pricingBreakdown?.totalRevenue?.toLocaleString() || '0'}</p>
                </div>
              </div>
              <p className="text-sm text-gray-400 mt-2">Expected monthly</p>
            </div>
          </div>
        </div>
      </div>

      {/* NEW: Training Analytics Section */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">🥋 Training Analytics (30+ Day Tracking)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* New Students Card */}
          <div className="bg-blue-700 rounded-lg p-6 border border-gray-700 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🆕</span>
                  <div>
                    <p className="text-sm font-medium text-gray-300">New Students</p>
                    <p className="text-2xl font-bold text-white">{trainingMetrics.newStudents}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-400 mt-2">Monitor engagement</p>
              </div>
            </div>
          </div>

          {/* Active Training Card */}
          <div className="bg-green-700 rounded-lg p-6 border border-gray-700 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🥋</span>
                  <div>
                    <p className="text-sm font-medium text-gray-300">Training Active</p>
                    <p className="text-2xl font-bold text-white">{trainingMetrics.activeTraining}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-400 mt-2">Regular attendance</p>
              </div>
            </div>
          </div>

          {/* Missed 3+ Weeks Card */}
          <div className="bg-orange-700 rounded-lg p-6 border border-gray-700 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <p className="text-sm font-medium text-gray-300">Missed 3+ Weeks</p>
                    <p className="text-2xl font-bold text-white">{trainingMetrics.missed3Weeks}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-400 mt-2">Priority contact needed</p>
              </div>
            </div>
          </div>

          {/* Inactive 30+ Days Card */}
          <div className="bg-red-700 rounded-lg p-6 border border-gray-700 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🚨</span>
                  <div>
                    <p className="text-sm font-medium text-gray-300">Inactive 30+ Days</p>
                    <p className="text-2xl font-bold text-white">{trainingMetrics.inactive30Days}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-400 mt-2">Revenue leakage risk</p>
              </div>
            </div>
          </div>
        </div>

        {/* Business Intelligence Alert */}
        {(trainingMetrics.missed3Weeks > 0 || trainingMetrics.inactive30Days > 0) && (
          <div className="mt-4 bg-red-900 border border-red-700 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <span className="text-red-400">🚨</span>
              <h4 className="text-red-300 font-medium">Revenue Protection Alert</h4>
            </div>
            <p className="text-red-200 text-sm mt-2">
              {trainingMetrics.missed3Weeks + trainingMetrics.inactive30Days} students need attention. 
              Contact parents to prevent membership cancellations.
            </p>
          </div>
        )}
      </div>

      {/* Revenue Analytics */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">💰 Revenue Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Total Revenue Card */}
          <div className="bg-green-800 rounded-lg p-6 border border-gray-700 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">💰</span>
                  <div>
                    <p className="text-sm font-medium text-gray-300">Total Revenue</p>
                    <p className="text-2xl font-bold text-white">₱{pricingBreakdown?.totalRevenue?.toLocaleString() || '0'}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-400 mt-2">Expected monthly income</p>
              </div>
            </div>
          </div>

          {/* Legacy vs Standard */}
          <div className="bg-purple-800 rounded-lg p-6 border border-gray-700 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🏷️</span>
                  <div>
                    <p className="text-sm font-medium text-gray-300">Pricing Tiers</p>
                    <p className="text-2xl font-bold text-white">
                      {pricingBreakdown?.legacy || 0} / {pricingBreakdown?.current || 0}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-400 mt-2">Legacy / Standard members</p>
              </div>
            </div>
          </div>

          {/* Average Revenue */}
          <div className="bg-blue-800 rounded-lg p-6 border border-gray-700 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">📊</span>
                  <div>
                    <p className="text-sm font-medium text-gray-300">Avg per Student</p>
                    <p className="text-2xl font-bold text-white">
                      ₱{students?.length > 0 ? Math.round((pricingBreakdown?.totalRevenue || 0) / students.length).toLocaleString() : '0'}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-400 mt-2">Revenue per student</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardStatistics;