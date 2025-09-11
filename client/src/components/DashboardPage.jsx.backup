// File: client/src/components/DashboardPage.jsx
// Lines 1-35: Enhanced imports with Phase 1 utility functions
import React, { useState, useCallback, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

// Custom Hooks - Real API data management
import useStudentManagement from "../hooks/useStudentManagement";
import { useDashboardData } from "../hooks/useDashboardData";
import { useToast } from "../hooks/useToast";

// PHASE 1: Utility Functions - Extracted zero-risk pure functions
import { 
  calculateRevenueData,
  calculateStudentStatus,
  calculateDaysRemaining,
  canSendReminder
} from "../utils/studentCalculations";

// Existing Components - Preserved all functionality
import StatisticsCards from "./dashboard/StatisticsCards";
import PricingDistribution from "./dashboard/PricingDistribution";
import StudentManagementSection from "./dashboard/StudentManagementSection";
import StudentProfileView from "./StudentProfileView";
import StudentEditForm from "./StudentEditForm";
import PaymentModal from "./PaymentModal";
import AddStudentModal from "./AddStudentModal";
import SMSCreditsModal from "./modals/SMSCreditsModal";
import SMSHistoryModal from "./modals/SMSHistoryModal";
import WeekendEventModal from "./modals/WeekendEventModal";
import MonthlyReportModal from "./modals/MonthlyReportModal"; // NEW: Monthly Report Modal
import AnnouncementBanner from "./dashboard/AnnouncementBanner";

// Lines 35-90: Dark Theme Logout Button Component (PRESERVED)
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

// Lines 55-180: ENHANCED DARK THEME HEADER - Mobile-first responsive design with Monthly Report Button (PRESERVED)
const DarkThemeHeader = ({ 
  user, 
  onRefresh, 
  onOpenCredits, 
  onOpenHistory, 
  onOpenWeekendEvent,
  onOpenMonthlyReport, // NEW: Monthly Report callback
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
            
            {/* NEW: Monthly Report Button - Purple theme */}
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

// Lines 185-260: ENHANCED DARK THEME STATISTICS - Horizontal layout matching design (PRESERVED)
const DarkThemeStatistics = ({ dashboardData, students, tabCounts, pricingBreakdown }) => {
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
      {/* Statistics Cards - Horizontal layout like your design */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {statisticsData.map((stat, index) => (
          <div 
            key={index}
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

// Lines 265-315: ENHANCED MAIN DASHBOARD COMPONENT - Complete implementation with imported utilities
export default function DashboardPage() {
  const { user, token } = useAuth();
  const { showSuccess, showError } = useToast();

  // State management - Comprehensive modal and view state (ENHANCED)
  const [currentView, setCurrentView] = useState("dashboard");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [addStudentModalOpen, setAddStudentModalOpen] = useState(false);
  const [smsCreditsModalOpen, setSmsCreditsModalOpen] = useState(false);
  const [smsHistoryModalOpen, setSmsHistoryModalOpen] = useState(false);
  const [weekendEventModalOpen, setWeekendEventModalOpen] = useState(false);
  const [monthlyReportModalOpen, setMonthlyReportModalOpen] = useState(false); // NEW: Monthly Report Modal State
  const [announcements, setAnnouncements] = useState([]);
  const [smsLoading, setSmsLoading] = useState(false);

  // API data hooks - Enhanced error handling
  const { 
    dashboardData, 
    students, 
    setStudents, 
    loading, 
    error, 
    refetch 
  } = useDashboardData(token);

  // Enhanced student management hook - All student operations
  const {
    filteredStudents,
    tabCounts,
    pricingBreakdown,
    currentTab,
    searchQuery,
    isSearchActive,
    setCurrentTab,
    setSearchQuery,
    setIsSearchActive,
    clearSearch,
    getStudentStatus,
    getDaysRemaining,
    canSendReminder: hookCanSendReminder
  } = useStudentManagement(students);

  // PHASE 1: Revenue calculation using imported utility function
  const revenueData = useMemo(() => {
    return calculateRevenueData(students);
  }, [students]);

  // NEW: Monthly Report modal handlers - Lines 315-325
  const handleOpenMonthlyReportModal = useCallback(() => {
    setMonthlyReportModalOpen(true);
  }, []);

  const handleCloseMonthlyReportModal = useCallback(() => {
    setMonthlyReportModalOpen(false);
  }, []);

  // Event handlers - Comprehensive student operations (PRESERVED)
  const handleProcessPayment = useCallback((student) => {
    setSelectedStudent(student);
    setPaymentModalOpen(true);
  }, []);

  const handleViewStudent = useCallback((studentId) => {
    const student = students.find(s => s.id === studentId);
    if (student) {
      setSelectedStudent(student);
      setCurrentView("profile");
    } else {
      showError("Student not found");
    }
  }, [students, showError]);

  const handleEditStudent = useCallback((student) => {
    setSelectedStudent(student);
    setCurrentView("edit");
  }, []);

  const handleBackToDashboard = useCallback(() => {
    setCurrentView("dashboard");
    setSelectedStudent(null);
  }, []);

  // Enhanced SMS reminder handler with comprehensive error handling (PRESERVED)
  const handleSendReminder = useCallback(async (student) => {
    if (smsLoading) {
      showError("SMS reminder already in progress. Please wait.");
      return;
    }

    if (!student || !student.id) {
      showError("Invalid student data");
      return;
    }

    const phoneNumber = student.phone || student.phoneNumber;
    if (!phoneNumber) {
      showError(`${student.name} has no phone number on file`);
      return;
    }

    // PHASE 1: Using imported utility function for SMS eligibility check
    if (!canSendReminder(student)) {
      const status = calculateStudentStatus(student);
      showError(`Cannot send reminder to ${student.name}. SMS reminders are only available for expiring and overdue students. Status: ${status}`);
      return;
    }

    setSmsLoading(true);

    try {
      const response = await fetch('/api/reminders/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: student.id,
          testMode: false,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP ${response.status}`);
      }

      if (data.success) {
        showSuccess(
          `SMS reminder sent successfully to ${student.name}! ` +
          `Cost: ₱${data.data?.cost || '0.60'}`
        );
      } else {
        throw new Error(data.message || 'SMS sending failed');
      }

    } catch (error) {
      console.error("❌ SMS reminder error:", error);
      
      if (error.message.includes('429')) {
        showError(`Rate limit: Cannot send another reminder to ${student.name} yet. Please wait 24 hours.`);
      } else if (error.message.includes('404')) {
        showError(`Student ${student.name} not found`);
      } else if (error.message.includes('400')) {
        showError(`Invalid phone number for ${student.name}`);
      } else if (error.message.includes('500')) {
        showError('SMS service temporarily unavailable. Please try again later.');
      } else {
        showError(`Failed to send SMS to ${student.name}: ${error.message}`);
      }
    } finally {
      setSmsLoading(false);
    }
  }, [token, showSuccess, showError, smsLoading]);

  // Additional comprehensive handlers (PRESERVED)
  const handleEditSave = useCallback(async (formData) => {
    try {
      const response = await fetch(`/api/students/${formData.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update student');
      }

      showSuccess(`Student ${formData.name} updated successfully!`);
      refetch();
      setCurrentView("dashboard");
      setSelectedStudent(null);
    } catch (error) {
      throw new Error(error.message || 'Failed to update student');
    }
  }, [token, showSuccess, refetch]);

  const handlePaymentSuccess = useCallback((paymentData) => {
    showSuccess(`Payment of ₱${paymentData.amount} processed successfully!`);
    refetch();
    setPaymentModalOpen(false);
    setSelectedStudent(null);
  }, [showSuccess, refetch]);

  const handleStudentAdded = useCallback((newStudent) => {
    showSuccess(`Student ${newStudent.name} added successfully!`);
    refetch();
    setAddStudentModalOpen(false);
  }, [showSuccess, refetch]);

  // Weekend event handlers - Enhanced functionality (PRESERVED)
  const handleOpenWeekendEventModal = useCallback(() => {
    setWeekendEventModalOpen(true);
  }, []);

  const handleEventCreated = useCallback((eventData) => {
    setAnnouncements(prev => [{
      id: eventData.id || Date.now(),
      type: "success",
      title: eventData.title,
      message: eventData.message,
      timestamp: new Date(),
      dismissible: true
    }, ...prev]);
    showSuccess(`Event "${eventData.title}" created successfully!`);
  }, [showSuccess]);

  const handleDismissAnnouncement = useCallback((announcementId) => {
    setAnnouncements(prev => prev.filter(a => a.id !== announcementId));
  }, []);

  const handleEditAnnouncement = useCallback(() => {
    showSuccess('Edit functionality coming soon');
  }, [showSuccess]);

  // Loading state - Enhanced dark theme loading (PRESERVED)
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-300 text-lg font-medium">Loading dashboard...</p>
          <p className="text-gray-500 text-sm mt-2">Fetching student data and statistics</p>
        </div>
      </div>
    );
  }

  // Error state - Enhanced dark theme error handling (PRESERVED)
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 max-w-md w-full text-center border border-gray-700">
          <div className="text-red-400 mb-4 text-4xl">❌</div>
          <h3 className="text-xl font-semibold text-white mb-2">Dashboard Error</h3>
          <p className="text-red-400 text-sm mb-6">{error}</p>
          <button 
            onClick={refetch} 
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  // Profile view - Enhanced dark theme profile (ENHANCED with Monthly Report)
  if (currentView === "profile" && selectedStudent) {
    return (
      <div className="min-h-screen bg-gray-900">
        <DarkThemeHeader 
          user={user}
          onRefresh={refetch}
          onOpenCredits={() => setSmsCreditsModalOpen(true)}
          onOpenHistory={() => setSmsHistoryModalOpen(true)}
          onOpenWeekendEvent={handleOpenWeekendEventModal}
          onOpenMonthlyReport={handleOpenMonthlyReportModal} // NEW: Pass Monthly Report handler
          loading={loading}
        />
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={handleBackToDashboard}
              className="mb-6 flex items-center text-blue-400 hover:text-blue-300 text-sm font-medium min-h-[44px] transition-colors"
            >
              ← Back to Dashboard
            </button>
            <StudentProfileView
              student={selectedStudent}
              onBack={handleBackToDashboard}
              onEdit={handleEditStudent}
            />
          </div>
        </main>
      </div>
    );
  }

  // Edit view - Enhanced dark theme editing (ENHANCED with Monthly Report)
  if (currentView === "edit" && selectedStudent) {
    return (
      <div className="min-h-screen bg-gray-900">
        <DarkThemeHeader 
          user={user}
          onRefresh={refetch}
          onOpenCredits={() => setSmsCreditsModalOpen(true)}
          onOpenHistory={() => setSmsHistoryModalOpen(true)}
          onOpenWeekendEvent={handleOpenWeekendEventModal}
          onOpenMonthlyReport={handleOpenMonthlyReportModal} // NEW: Pass Monthly Report handler
          loading={loading}
        />
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => setCurrentView("profile")}
              className="mb-6 flex items-center text-blue-400 hover:text-blue-300 text-sm font-medium min-h-[44px] transition-colors"
            >
              ← Back to Profile
            </button>
            <StudentEditForm
              student={selectedStudent}
              onBack={handleBackToDashboard}
              onSave={handleEditSave}
            />
          </div>
        </main>
      </div>
    );
  }

  // Main dashboard view - Enhanced dark theme implementation (ENHANCED with Monthly Report)
  return (
    <div className="min-h-screen bg-gray-900">
      <DarkThemeHeader 
        user={user}
        onRefresh={refetch}
        onOpenCredits={() => setSmsCreditsModalOpen(true)}
        onOpenHistory={() => setSmsHistoryModalOpen(true)}
        onOpenWeekendEvent={handleOpenWeekendEventModal}
        onOpenMonthlyReport={handleOpenMonthlyReportModal} // NEW: Pass Monthly Report handler
        loading={loading}
      />

      <main className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Announcements Banner */}
          {announcements.length > 0 && (
            <AnnouncementBanner 
              announcements={announcements}
              onDismiss={handleDismissAnnouncement}
              onEdit={handleEditAnnouncement}
            />
          )}

          {/* Statistics Section - Enhanced dark theme */}
          <DarkThemeStatistics 
            dashboardData={dashboardData}
            students={students}
            tabCounts={tabCounts}
            pricingBreakdown={revenueData}
          />

          {/* Student Management Section - Enhanced container */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden shadow-lg">
            <StudentManagementSection
              filteredStudents={filteredStudents}
              students={students}
              tabCounts={tabCounts}
              currentTab={currentTab}
              searchQuery={searchQuery}
              isSearchActive={isSearchActive}
              setCurrentTab={setCurrentTab}
              setSearchQuery={setSearchQuery}
              setIsSearchActive={setIsSearchActive}
              setAddStudentModalOpen={setAddStudentModalOpen}
              onProcessPayment={handleProcessPayment}
              onViewStudent={handleViewStudent}
              onEditStudent={handleEditStudent}
              onSendReminder={handleSendReminder}
              canSendReminder={hookCanSendReminder}
              getStudentStatus={getStudentStatus}
              getDaysRemaining={getDaysRemaining}
              smsLoading={smsLoading}
            />
          </div>
        </div>
      </main>

      {/* All Enhanced Modals - PRESERVED functionality */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => {
          setPaymentModalOpen(false);
          setSelectedStudent(null);
        }}
        student={selectedStudent}
        onPaymentSuccess={handlePaymentSuccess}
      />

      <AddStudentModal
        isOpen={addStudentModalOpen}
        onClose={() => setAddStudentModalOpen(false)}
        onStudentAdded={handleStudentAdded}
      />

      <SMSCreditsModal
        isOpen={smsCreditsModalOpen}
        onClose={() => setSmsCreditsModalOpen(false)}
      />

      <SMSHistoryModal
        isOpen={smsHistoryModalOpen}
        onClose={() => setSmsHistoryModalOpen(false)}
      />

      <WeekendEventModal
        isOpen={weekendEventModalOpen}
        onClose={() => setWeekendEventModalOpen(false)}
        onEventCreated={handleEventCreated}
        existingEvents={announcements}
        students={students}
      />

      <MonthlyReportModal
        isOpen={monthlyReportModalOpen}
        onClose={handleCloseMonthlyReportModal}
      />
    </div>
  );
}