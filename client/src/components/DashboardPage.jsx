// File: client/src/components/DashboardPage.jsx
// Line 1: FINAL PRODUCTION - Fixed revenue calculation + SMS only for expiring/overdue
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

// Line 23: FIXED REVENUE CALCULATION FUNCTION
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
    // Get the student's monthly rate
    const monthlyRate = student.monthlyRate || student.rate || 1400;
    
    // Check if student is legacy (rate < 1400 or explicitly marked)
    const isLegacy = student.isLegacyStudent || monthlyRate < 1400;
    
    // Only count active students with completed payments for revenue
    const hasActiveMembership = student.memberships && student.memberships.length > 0;
    const latestMembership = hasActiveMembership ? 
      student.memberships.reduce((latest, current) => {
        const currentDate = new Date(current.endDate || current.createdAt);
        const latestDate = new Date(latest.endDate || latest.createdAt);
        return currentDate > latestDate ? current : latest;
      }, student.memberships[0]) : null;

    // Check if membership is still active (not expired)
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

// Line 78: FIXED STATUS CALCULATION FUNCTION  
const calculateStudentStatus = (student) => {
  if (!student?.memberships || student.memberships.length === 0) {
    return 'inactive';
  }

  // Get latest membership
  const latestMembership = student.memberships.reduce((latest, current) => {
    const currentDate = new Date(current.endDate || current.createdAt);
    const latestDate = new Date(latest?.endDate || latest?.createdAt || 0);
    return currentDate > latestDate ? current : latest;
  }, null);

  if (!latestMembership?.endDate) return 'inactive';

  try {
    const endDate = new Date(latestMembership.endDate);
    const today = new Date();
    
    // Ensure valid dates
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

// Line 113: FIXED DAYS REMAINING CALCULATION
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

// Line 143: SMS ELIGIBILITY CHECK - Only expiring and overdue students
const canSendReminder = (student) => {
  const status = calculateStudentStatus(student);
  const hasPhone = Boolean(student.phone || student.phoneNumber);
  
  // FIXED: Only allow SMS for expiring and overdue students with phone numbers
  return (status === 'expiring' || status === 'overdue') && hasPhone;
};

// Line 152: RESPONSIVE HEADER
const ResponsiveHeader = ({ 
  user, 
  onRefresh, 
  onOpenCredits, 
  onOpenHistory, 
  onOpenWeekendEvent,
  loading 
}) => (
  <header className="bg-white shadow-sm border-b">
    <div className="px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="text-center sm:text-left">
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl lg:text-3xl">
            Admin Dashboard
          </h1>
          <p className="text-sm text-gray-600 mt-1 sm:text-base">
            Welcome back, {user?.email || 'Administrator'}
          </p>
        </div>
        
        <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:items-center sm:space-x-3">
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-3">
            <button
              onClick={onOpenWeekendEvent}
              className="flex items-center justify-center px-3 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 transform hover:scale-105 shadow-lg text-sm font-medium min-h-[44px]"
              title="Create Weekend Event with Selective Messaging"
              disabled={loading}
            >
              <span className="mr-1">📅</span>
              <span className="hidden sm:inline">Weekend Event</span>
              <span className="sm:hidden">Event</span>
            </button>

            <button
              onClick={onOpenCredits}
              className="flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium min-h-[44px]"
              disabled={loading}
            >
              <span className="mr-1">💳</span>
              <span className="hidden sm:inline">Credits</span>
              <span className="sm:hidden">Credits</span>
            </button>

            <button
              onClick={onOpenHistory}
              className="flex items-center justify-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium min-h-[44px]"
              disabled={loading}
            >
              <span className="mr-1">📊</span>
              <span className="hidden sm:inline">History</span>
              <span className="sm:hidden">History</span>
            </button>
            
            <button
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium min-h-[44px] disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="mr-1 sm:hidden">🔄</span>
                  <span className="hidden sm:inline">Refresh Data</span>
                  <span className="sm:hidden">Refresh</span>
                </>
              )}
            </button>
          </div>

          <div className="flex justify-center sm:justify-end">
            <LogoutButton />
          </div>
        </div>
      </div>
    </div>
  </header>
);

// Line 213: FIXED DESKTOP STATISTICS LAYOUT - Horizontal cards like Image 2
const ResponsiveStatistics = ({ dashboardData, students, tabCounts, pricingBreakdown }) => {
  // FIXED: Create horizontal cards that match your desktop design
  const statisticsData = [
    {
      title: "Total Students",
      value: students?.length || 0,
      subtitle: "All registered students",
      icon: "👥",
      bgColor: "bg-slate-700"
    },
    {
      title: "Active",
      value: tabCounts?.active || 0,
      subtitle: "Currently enrolled",
      icon: "✅",
      bgColor: "bg-slate-700"
    },
    {
      title: "Expiring Soon",
      value: tabCounts?.expiring || 0,
      subtitle: "Within 7 days",
      icon: "⚠️",
      bgColor: "bg-slate-700"
    },
    {
      title: "Overdue",
      value: tabCounts?.overdue || 0,
      subtitle: "Payment overdue",
      icon: "🚨",
      bgColor: "bg-slate-700"
    },
    {
      title: "Monthly Revenue",
      value: `₱${(pricingBreakdown?.totalRevenue || 0).toLocaleString()}`,
      subtitle: "Expected monthly",
      icon: "💰",
      bgColor: "bg-slate-700"
    }
  ];

  return (
    <div className="space-y-6">
      {/* FIXED: Desktop horizontal cards layout like Image 2 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {statisticsData.map((stat, index) => (
          <div 
            key={index}
            className={`${stat.bgColor} rounded-lg p-4 text-white shadow-lg`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-3">{stat.icon}</span>
                  <div>
                    <h3 className="text-sm font-medium text-gray-300">{stat.title}</h3>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-xs text-gray-400">{stat.subtitle}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Use EXISTING PricingDistribution component for real data */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <PricingDistribution pricingBreakdown={pricingBreakdown} />
      </div>
    </div>
  );
};

// Line 230: MAIN DASHBOARD COMPONENT
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

  // FIXED: Calculate data directly from students instead of broken hook
  const { tabCounts, pricingBreakdown, filteredStudents } = useMemo(() => {
    if (!students || students.length === 0) {
      return {
        tabCounts: { all: 0, active: 0, expiring: 0, overdue: 0, inactive: 0 },
        pricingBreakdown: calculateRevenueData([]),
        filteredStudents: []
      };
    }

    // Calculate tab counts
    const counts = { all: students.length, active: 0, expiring: 0, overdue: 0, inactive: 0 };
    
    students.forEach(student => {
      const status = calculateStudentStatus(student);
      counts[status] = (counts[status] || 0) + 1;
    });

    // Calculate revenue data
    const revenue = calculateRevenueData(students);

    return {
      tabCounts: counts,
      pricingBreakdown: revenue,
      filteredStudents: students // For now, show all students
    };
  }, [students]);

  // Use existing hook for search and filtering only
  const {
    currentTab,
    searchQuery,
    isSearchActive,
    setCurrentTab,
    setSearchQuery,
    setIsSearchActive,
    clearSearch
  } = useStudentManagement(students);

  // Event handlers
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

  // Line 300: ENHANCED SMS REMINDER HANDLER - Real API with eligibility check
  const handleSendReminder = useCallback(async (student) => {
    if (smsLoading) {
      showError("SMS reminder already in progress. Please wait.");
      return;
    }

    // Validate student data
    if (!student || !student.id) {
      showError("Invalid student data");
      return;
    }

    // Check if student has phone number
    const phoneNumber = student.phone || student.phoneNumber;
    if (!phoneNumber) {
      showError(`${student.name} has no phone number on file`);
      return;
    }

    // FIXED: Check if student is eligible for reminder (expiring/overdue only)
    if (!canSendReminder(student)) {
      const status = calculateStudentStatus(student);
      showError(`Cannot send reminder to ${student.name}. SMS reminders are only available for expiring and overdue students. Status: ${status}`);
      return;
    }

    setSmsLoading(true);

    try {
      console.log(`📱 Sending SMS reminder to ${student.name} (${phoneNumber})`);

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
        
        console.log("✅ SMS reminder sent:", data);
      } else {
        throw new Error(data.message || 'SMS sending failed');
      }

    } catch (error) {
      console.error("❌ SMS reminder error:", error);
      
      // Enhanced error handling
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

  // Additional handlers
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

  // Weekend event handlers
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

  // Loading and error states
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full text-center">
          <div className="text-red-500 mb-4">❌</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Dashboard Error</h3>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <button onClick={refetch} className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Profile and edit views
  if (currentView === "profile" && selectedStudent) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ResponsiveHeader 
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
              className="mb-4 flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium min-h-[44px]"
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

  if (currentView === "edit" && selectedStudent) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ResponsiveHeader 
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
              className="mb-4 flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium min-h-[44px]"
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

  // Main dashboard view
  return (
    <div className="min-h-screen bg-gray-50">
      <ResponsiveHeader 
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

          {/* FIXED: Statistics Section with real revenue data */}
          <ResponsiveStatistics 
            dashboardData={dashboardData}
            students={students}
            tabCounts={tabCounts}
            pricingBreakdown={pricingBreakdown}
          />

          {/* Student Management Section with fixed SMS logic */}
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
            canSendReminder={canSendReminder}
            getStudentStatus={calculateStudentStatus}
            getDaysRemaining={calculateDaysRemaining}
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