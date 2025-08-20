// File: client/src/components/DashboardPage.jsx
// Lines 1-25: DARK THEME DASHBOARD - Matches the provided design exactly
import React, { useState, useCallback, useMemo } from "react";
import { useAuth } from "../context/AuthContext";

// Custom Hooks - Real API data management
import useStudentManagement from "../hooks/useStudentManagement";
import { useDashboardData } from "../hooks/useDashboardData";
import { useToast } from "../hooks/useToast";

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
import AnnouncementBanner from "./dashboard/AnnouncementBanner";
import LogoutButton from "./LogoutButton";

// Lines 26-80: Revenue calculation functions (unchanged)
const calculateRevenueData = (students) => {
  if (!students || students.length === 0) {
    return {
      totalRevenue: 0,
      totalMonthly: 0,
      total: 0,
      legacy: 0,
      legacyRevenue: 0,
      current: 0,
      currentRevenue: 0,
      breakdown: []
    };
  }

  let totalRevenue = 0;
  let legacyCount = 0;
  let legacyRevenue = 0;
  let standardCount = 0;
  let standardRevenue = 0;

  students.forEach(student => {
    const monthlyRate = student.monthlyRate || student.rate || 1400;
    const isLegacy = student.isLegacyStudent || monthlyRate < 1400;
    
    const hasActiveMembership = student.memberships && student.memberships.length > 0;
    const latestMembership = hasActiveMembership ? 
      student.memberships.reduce((latest, current) => {
        const currentDate = new Date(current.endDate || current.createdAt);
        const latestDate = new Date(latest.endDate || latest.createdAt);
        return currentDate > latestDate ? current : latest;
      }, student.memberships[0]) : null;

    const isActive = latestMembership && new Date(latestMembership.endDate) > new Date();
    
    if (isActive) {
      totalRevenue += monthlyRate;
      
      if (isLegacy) {
        legacyCount++;
        legacyRevenue += monthlyRate;
      } else {
        standardCount++;
        standardRevenue += monthlyRate;
      }
    }
  });

  return {
    totalRevenue,
    totalMonthly: totalRevenue,
    total: students.length,
    legacy: legacyCount,
    legacyRevenue,
    current: standardCount,
    currentRevenue: standardRevenue,
    breakdown: [
      { type: 'legacy', count: legacyCount, revenue: legacyRevenue },
      { type: 'standard', count: standardCount, revenue: standardRevenue }
    ]
  };
};

// Lines 85-150: Status and date calculation functions (unchanged but dark theme ready)
const calculateStudentStatus = (student) => {
  if (!student?.memberships || student.memberships.length === 0) {
    return 'inactive';
  }

  const latestMembership = student.memberships.reduce((latest, current) => {
    const currentDate = new Date(current.endDate || current.createdAt);
    const latestDate = new Date(latest?.endDate || latest?.createdAt || 0);
    return currentDate > latestDate ? current : latest;
  }, null);

  if (!latestMembership?.endDate) return 'inactive';

  try {
    const endDate = new Date(latestMembership.endDate);
    const today = new Date();
    
    if (isNaN(endDate.getTime()) || isNaN(today.getTime())) return 'inactive';
    
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    
    const timeDiff = endDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    if (daysDiff < 0) return 'overdue';
    if (daysDiff <= 7) return 'expiring';
    return 'active';
  } catch (error) {
    console.warn("Date calculation error:", error);
    return 'inactive';
  }
};

const calculateDaysRemaining = (student) => {
  if (!student?.memberships || student.memberships.length === 0) return 0;
  
  const latestMembership = student.memberships.reduce((latest, current) => {
    const currentDate = new Date(current.endDate || current.createdAt);
    const latestDate = new Date(latest?.endDate || latest?.createdAt || 0);
    return currentDate > latestDate ? current : latest;
  }, null);

  if (!latestMembership?.endDate) return 0;

  try {
    const endDate = new Date(latestMembership.endDate);
    const today = new Date();
    
    if (isNaN(endDate.getTime()) || isNaN(today.getTime())) return 0;
    
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    
    const timeDiff = endDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    return daysDiff;
  } catch (error) {
    console.warn("Date calculation error:", error);
    return 0;
  }
};

const canSendReminder = (student) => {
  const status = calculateStudentStatus(student);
  const hasPhone = Boolean(student.phone || student.phoneNumber);
  return (status === 'expiring' || status === 'overdue') && hasPhone;
};

// Lines 155-220: DARK THEME HEADER - Matches your design exactly
const DarkThemeHeader = ({ 
  user, 
  onRefresh, 
  onOpenCredits, 
  onOpenHistory, 
  onOpenWeekendEvent,
  loading 
}) => (
  <header className="bg-gray-900 border-b border-gray-800">
    <div className="px-6 py-6">
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        {/* Title Section */}
        <div>
          <h1 className="text-2xl font-bold text-white lg:text-3xl">
            Student Membership Dashboard
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Welcome back, {user?.email || 'Administrator'}
          </p>
        </div>
        
        {/* Action Buttons - Matches your design */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={onOpenWeekendEvent}
            className="flex items-center justify-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors text-sm font-medium min-h-[44px]"
            title="Create Weekend Event"
            disabled={loading}
          >
            <span className="mr-2">📅</span>
            <span>Weekend Event</span>
          </button>

          <button
            onClick={onOpenCredits}
            className="flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium min-h-[44px]"
            disabled={loading}
          >
            <span className="mr-2">💳</span>
            <span>Credits</span>
          </button>

          <button
            onClick={onOpenHistory}
            className="flex items-center justify-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm font-medium min-h-[44px]"
            disabled={loading}
          >
            <span className="mr-2">📊</span>
            <span>History</span>
          </button>
          
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium min-h-[44px] disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span className="mr-2">🔄</span>
                <span>Refresh Data</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  </header>
);

// Lines 225-300: DARK THEME STATISTICS CARDS - Matches your design exactly
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

// Lines 305-700: MAIN DASHBOARD COMPONENT WITH DARK THEME
export default function DashboardPage() {
  const { user, token } = useAuth();
  const { showSuccess, showError } = useToast();

  // State management
  const [currentView, setCurrentView] = useState("dashboard");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [addStudentModalOpen, setAddStudentModalOpen] = useState(false);
  const [smsCreditsModalOpen, setSmsCreditsModalOpen] = useState(false);
  const [smsHistoryModalOpen, setSmsHistoryModalOpen] = useState(false);
  const [weekendEventModalOpen, setWeekendEventModalOpen] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [smsLoading, setSmsLoading] = useState(false);

  // API data hooks
  const { 
    dashboardData, 
    students, 
    setStudents, 
    loading, 
    error, 
    refetch 
  } = useDashboardData(token);

  // Use hook's filteredStudents and calculations
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

  // Revenue calculation from hook's pricing breakdown
  const revenueData = useMemo(() => {
    return calculateRevenueData(students);
  }, [students]);

  // Event handlers (unchanged)
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

  // SMS reminder handler (unchanged)
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

    if (!hookCanSendReminder(student)) {
      const status = getStudentStatus(student);
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
  }, [token, showSuccess, showError, smsLoading, hookCanSendReminder, getStudentStatus]);

  // Additional handlers (unchanged)
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

  // Weekend event handlers (unchanged)
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

  // Loading state - Dark theme
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-300 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state - Dark theme
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 max-w-sm w-full text-center border border-gray-700">
          <div className="text-red-400 mb-4">❌</div>
          <h3 className="text-lg font-semibold text-white mb-2">Dashboard Error</h3>
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <button onClick={refetch} className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Profile view - Dark theme
  if (currentView === "profile" && selectedStudent) {
    return (
      <div className="min-h-screen bg-gray-900">
        <DarkThemeHeader 
          user={user}
          onRefresh={refetch}
          onOpenCredits={() => setSmsCreditsModalOpen(true)}
          onOpenHistory={() => setSmsHistoryModalOpen(true)}
          onOpenWeekendEvent={handleOpenWeekendEventModal}
          loading={loading}
        />
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={handleBackToDashboard}
              className="mb-4 flex items-center text-blue-400 hover:text-blue-300 text-sm font-medium min-h-[44px]"
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

  // Edit view - Dark theme
  if (currentView === "edit" && selectedStudent) {
    return (
      <div className="min-h-screen bg-gray-900">
        <DarkThemeHeader 
          user={user}
          onRefresh={refetch}
          onOpenCredits={() => setSmsCreditsModalOpen(true)}
          onOpenHistory={() => setSmsHistoryModalOpen(true)}
          onOpenWeekendEvent={handleOpenWeekendEventModal}
          loading={loading}
        />
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => setCurrentView("profile")}
              className="mb-4 flex items-center text-blue-400 hover:text-blue-300 text-sm font-medium min-h-[44px]"
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

  // Main dashboard view - Dark theme
  return (
    <div className="min-h-screen bg-gray-900">
      <DarkThemeHeader 
        user={user}
        onRefresh={refetch}
        onOpenCredits={() => setSmsCreditsModalOpen(true)}
        onOpenHistory={() => setSmsHistoryModalOpen(true)}
        onOpenWeekendEvent={handleOpenWeekendEventModal}
        loading={loading}
      />

      <main className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {announcements.length > 0 && (
            <AnnouncementBanner 
              announcements={announcements}
              onDismiss={handleDismissAnnouncement}
              onEdit={handleEditAnnouncement}
            />
          )}

          {/* Statistics Section - Dark theme */}
          <DarkThemeStatistics 
            dashboardData={dashboardData}
            students={students}
            tabCounts={tabCounts}
            pricingBreakdown={revenueData}
          />

          {/* Student Management Section - Will use dark theme version */}
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
      </main>

      {/* All Modals */}
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
    </div>
  );
}