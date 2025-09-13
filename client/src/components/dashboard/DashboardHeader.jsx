// File: client/src/components/dashboard/DashboardHeader.jsx
// Lines 1-150: Enhanced Dark Theme Header Component with Mobile-First Design
import React from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

// Lines 10-35: Dark Theme Logout Button Component
const DarkThemeLogoutButton = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logout();
      navigate('/');
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center justify-center px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium min-h-[44px] focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900"
      title="Logout"
    >
      <span className="mr-2">🚪</span>
      <span>Logout</span>
    </button>
  );
};

// Lines 40-150: Enhanced Dark Theme Header with Monthly Report Button (PRESERVED)
const DashboardHeader = ({ 
  user, 
  onRefresh, 
  onOpenCredits, 
  onOpenHistory, 
  onOpenWeekendEvent,
  onOpenMonthlyReport, // Monthly Report callback
  loading 
}) => (
  <header className="bg-gray-900 border-b border-gray-800">
    <div className="px-4 py-4 sm:px-6 lg:px-8">
      {/* Mobile-first layout with proper breathing space */}
      <div className="flex flex-col space-y-6 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        
        {/* Title Section - Better mobile typography */}
        <div className="text-center lg:text-left">
          <h1 className="text-xl font-bold text-white sm:text-2xl lg:text-3xl">
            Student Membership Dashboard
          </h1>
          <p className="text-gray-400 text-sm mt-2 sm:text-base">
            Welcome back, {user?.email || 'Administrator'}
          </p>
        </div>
        
        {/* Action Buttons Section - Mobile-optimized layout */}
        <div className="flex flex-col space-y-4 sm:space-y-3 lg:flex-row lg:items-center lg:space-y-0 lg:space-x-4">
          
          {/* Primary Action Buttons - Enhanced grid layout for mobile */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 lg:flex lg:items-center lg:gap-3">
            
            {/* Monthly Report Button - Purple theme */}
            <button
              onClick={onOpenMonthlyReport}
              className="flex items-center justify-center px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium min-h-[44px] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              title="Generate Monthly Payment Report"
              disabled={loading}
            >
              <span className="mr-2">📊</span>
              <span>Monthly Report</span>
            </button>

            {/* Weekend Event Button */}
            <button
              onClick={onOpenWeekendEvent}
              className="flex items-center justify-center px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors text-sm font-medium min-h-[44px] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              title="Create Weekend Event"
              disabled={loading}
            >
              <span className="mr-2">📅</span>
              <span>Weekend Event</span>
            </button>

            {/* Credits Button */}
            <button
              onClick={onOpenCredits}
              className="flex items-center justify-center px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium min-h-[44px] focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              title="Manage SMS Credits"
              disabled={loading}
            >
              <span className="mr-2">💳</span>
              <span>Credits</span>
            </button>

            {/* History Button */}
            <button
              onClick={onOpenHistory}
              className="flex items-center justify-center px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm font-medium min-h-[44px] focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              title="View SMS History"
              disabled={loading}
            >
              <span className="mr-2">📈</span>
              <span>History</span>
            </button>
            
            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              title="Refresh Dashboard Data"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <span className="mr-2">🔄</span>
                  <span>Refresh Data</span>
                </>
              )}
            </button>
          </div>

          {/* Logout Button Section - Properly separated with visual distinction */}
          <div className="flex justify-center lg:justify-end pt-3 lg:pt-0 border-t border-gray-700 lg:border-t-0 lg:border-l lg:border-gray-700 lg:pl-4">
            <DarkThemeLogoutButton />
          </div>
        </div>
      </div>
    </div>
  </header>
);

export default DashboardHeader;