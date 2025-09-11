// File: client/src/components/dashboard/DashboardViews.jsx
// Lines 1-200: Dashboard view components for different application states
import React from "react";
import DashboardHeader from "./DashboardHeader";
import StudentProfileView from "../StudentProfileView";
import StudentEditForm from "../StudentEditForm";

// Lines 10-45: Loading State Component with Dark Theme
export const LoadingView = () => (
  <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
      <p className="text-gray-300 text-lg font-medium">Loading dashboard...</p>
      <p className="text-gray-500 text-sm mt-2">Fetching student data and statistics</p>
    </div>
  </div>
);

// Lines 50-85: Error State Component with Retry Functionality
export const ErrorView = ({ error, onRetry }) => (
  <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 max-w-md w-full text-center border border-gray-700">
      <div className="text-red-400 mb-4 text-4xl">❌</div>
      <h3 className="text-xl font-semibold text-white mb-2">Dashboard Error</h3>
      <p className="text-red-400 text-sm mb-6">{error}</p>
      <button 
        onClick={onRetry} 
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        Retry Loading
      </button>
    </div>
  </div>
);

// Lines 90-135: Profile View Component with Full Header Integration
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
        <button
          onClick={onBack}
          className="mb-6 flex items-center text-blue-400 hover:text-blue-300 text-sm font-medium min-h-[44px] transition-colors"
        >
          ← Back to Dashboard
        </button>
        <StudentProfileView
          student={selectedStudent}
          onBack={onBack}
          onEdit={onEdit}
        />
      </div>
    </main>
  </div>
);

// Lines 140-185: Edit View Component with Navigation & Header
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
        <button
          onClick={onBack}
          className="mb-6 flex items-center text-blue-400 hover:text-blue-300 text-sm font-medium min-h-[44px] transition-colors"
        >
          ← Back to Profile
        </button>
        <StudentEditForm
          student={selectedStudent}
          onBack={onBack}
          onSave={onSave}
        />
      </div>
    </main>
  </div>
);