// File: client/src/components/dashboard/DashboardViews.jsx
// Lines 1-300: Enhanced dashboard view components with training integration

import React from "react";
import DashboardHeader from "./DashboardHeader";

// Lines 10-50: Loading View Component
export const LoadingView = () => (
  <div className="min-h-screen bg-gray-900 flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <h2 className="text-xl font-semibold text-white mb-2">Loading Dashboard</h2>
      <p className="text-gray-400">Please wait while we fetch your data...</p>
    </div>
  </div>
);

// Lines 55-95: Error View Component
export const ErrorView = ({ error, onRetry }) => (
  <div className="min-h-screen bg-gray-900 flex items-center justify-center">
    <div className="text-center max-w-md mx-auto px-4">
      <div className="text-red-500 mb-4">
        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-white mb-2">Dashboard Error</h2>
      <p className="text-gray-400 mb-6">{error?.message || 'An unexpected error occurred'}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  </div>
);

// Lines 100-200: Enhanced Profile View with Training History
export const ProfileView = ({ 
  user, 
  selectedStudent, 
  onBack, 
  onEdit, 
  onRefresh, 
  onOpenCredits, 
  onOpenHistory, 
  onOpenWeekendEvent, 
  onOpenMonthlyReport,
  onLogTraining, // NEW: Training logging callback
  loading 
}) => (
  <div className="min-h-screen bg-gray-900">
    <DashboardHeader 
      user={user}
      onRefresh={onRefresh}
      onOpenCredits={onOpenCredits}
      onOpenHistory={onOpenHistory}
      onOpenWeekendEvent={onOpenWeekendEvent}
      onOpenMonthlyReport={onOpenMonthlyReport}
      loading={loading}
    />

    <main className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Back Navigation */}
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
        </div>

        {/* Student Profile Header */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {selectedStudent?.name?.charAt(0) || 'S'}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{selectedStudent?.name}</h1>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900 text-green-300">
                    Active
                  </span>
                  <span className="text-sm text-gray-400">25 days remaining</span>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              {/* NEW: Log Training Button */}
              <button
                onClick={() => onLogTraining(selectedStudent)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                Log Training
              </button>
              <button
                onClick={() => onEdit(selectedStudent)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Basic Information */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-xl">👤</span>
              <h2 className="text-lg font-semibold text-white">Basic Information</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Name</span>
                <span className="text-white">{selectedStudent?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Email</span>
                <span className="text-white">{selectedStudent?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Phone</span>
                <span className="text-white">{selectedStudent?.phone || 'Not provided'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Student ID</span>
                <span className="text-white">#{selectedStudent?.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Monthly Rate</span>
                <span className="text-white">₱{selectedStudent?.monthlyRate?.toLocaleString() || '1,400'}/mo</span>
              </div>
            </div>
          </div>

          {/* Current Membership */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-xl">📋</span>
              <h2 className="text-lg font-semibold text-white">Current Membership</h2>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-900 text-green-300 mb-2">
                ✅ MONTHLY
              </div>
              <p className="text-2xl font-bold text-white mb-1">₱1,400</p>
              <p className="text-sm text-gray-400 mb-4">Monthly Fee</p>
              
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">START DATE</span>
                  <span className="text-gray-400">END DATE</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white">9/7/2025</span>
                  <span className="text-white">10/7/2025</span>
                </div>
              </div>
            </div>
          </div>

          {/* NEW: Training History Section */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-xl">🥋</span>
                <h2 className="text-lg font-semibold text-white">Training History</h2>
              </div>
              <button
                onClick={() => onLogTraining(selectedStudent)}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
              >
                Log Session
              </button>
            </div>
            
            {/* Training Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-900 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-blue-200">12</div>
                <div className="text-xs text-blue-400">Total Sessions</div>
              </div>
              <div className="bg-green-900 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-green-200">3</div>
                <div className="text-xs text-green-400">Days Since Last</div>
              </div>
              <div className="bg-purple-900 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-purple-200">89%</div>
                <div className="text-xs text-purple-400">Attendance Rate</div>
              </div>
              <div className="bg-orange-900 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-orange-200">Weekend</div>
                <div className="text-xs text-orange-400">Preferred Schedule</div>
              </div>
            </div>

            {/* Recent Sessions */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-3">Recent Sessions</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between bg-gray-900 rounded-lg p-3">
                  <div className="flex items-center space-x-3">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <div>
                      <div className="text-white text-sm">Weekend Session</div>
                      <div className="text-gray-400 text-xs">Saturday, 10:00am-11:30am</div>
                    </div>
                  </div>
                  <div className="text-gray-400 text-sm">Sep 12, 2025</div>
                </div>
                <div className="flex items-center justify-between bg-gray-900 rounded-lg p-3">
                  <div className="flex items-center space-x-3">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <div>
                      <div className="text-white text-sm">Weekend Session</div>
                      <div className="text-gray-400 text-xs">Sunday, 10:00am-11:30am</div>
                    </div>
                  </div>
                  <div className="text-gray-400 text-sm">Sep 8, 2025</div>
                </div>
                <div className="flex items-center justify-between bg-gray-900 rounded-lg p-3">
                  <div className="flex items-center space-x-3">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                    <div>
                      <div className="text-white text-sm">Weekend Session</div>
                      <div className="text-gray-400 text-xs">Saturday, 10:00am-11:30am - Late</div>
                    </div>
                  </div>
                  <div className="text-gray-400 text-sm">Sep 5, 2025</div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment History */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-xl">💳</span>
              <h2 className="text-lg font-semibold text-white">Payment History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-700">
                    <th className="pb-3">Description</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="space-y-2">
                  <tr className="border-b border-gray-800">
                    <td className="py-3 text-white">MONTHLY membership payment</td>
                    <td className="py-3 text-green-400">₱1,400</td>
                    <td className="py-3 text-gray-300">9/7/2025</td>
                    <td className="py-3">
                      <span className="px-2 py-1 bg-green-900 text-green-300 rounded-full text-xs">Completed</span>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="py-3 text-white">MONTHLY membership payment</td>
                    <td className="py-3 text-green-400">₱1,400</td>
                    <td className="py-3 text-gray-300">8/4/2025</td>
                    <td className="py-3">
                      <span className="px-2 py-1 bg-green-900 text-green-300 rounded-full text-xs">Completed</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
);

// Lines 250-300: Enhanced Edit View Component
export const EditView = ({ 
  user, 
  selectedStudent, 
  onBack, 
  onSave, 
  onRefresh, 
  onOpenCredits, 
  onOpenHistory, 
  onOpenWeekendEvent, 
  onOpenMonthlyReport,
  loading 
}) => (
  <div className="min-h-screen bg-gray-900">
    <DashboardHeader 
      user={user}
      onRefresh={onRefresh}
      onOpenCredits={onOpenCredits}
      onOpenHistory={onOpenHistory}
      onOpenWeekendEvent={onOpenWeekendEvent}
      onOpenMonthlyReport={onOpenMonthlyReport}
      loading={loading}
    />

    <main className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        
        {/* Back Navigation */}
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Profile
          </button>
        </div>

        {/* Edit Form Container */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h1 className="text-2xl font-bold text-white mb-6">Edit Student Profile</h1>
          
          <div className="text-center py-12">
            <p className="text-gray-400">Edit form component will be implemented here</p>
            <p className="text-sm text-gray-500 mt-2">This will include all student fields with validation</p>
          </div>
        </div>
      </div>
    </main>
  </div>
);