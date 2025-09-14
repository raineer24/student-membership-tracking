// File: client/src/components/DashboardPage.jsx
// Lines 1-25: Enhanced imports with Phase 1 & Phase 2 components + Training Sessions
import React, { useState, useCallback, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/useToast";

// Custom Hooks - Real API data management
import useStudentManagement from "../hooks/useStudentManagement";
import { useDashboardData } from "../hooks/useDashboardData";

// PHASE 1: Utility Functions - Extracted zero-risk pure functions
import { 
  calculateRevenueData,
  calculateStudentStatus,
  calculateDaysRemaining,
  canSendReminder
} from "../utils/studentCalculations";

// PHASE 2: Extracted Components - UI separation of concerns
import DashboardHeader from "./dashboard/DashboardHeader";
import DashboardStatistics from "./dashboard/DashboardStatistics";
import { LoadingView, ErrorView, ProfileView, EditView } from "./dashboard/DashboardViews";

// Existing Components - Preserved all functionality
import StudentManagementSection from "./dashboard/StudentManagementSection";
import AnnouncementBanner from "./dashboard/AnnouncementBanner";

// Modal Components - Preserved all functionality
import PaymentModal from "./PaymentModal";
import AddStudentModal from "./AddStudentModal";
import SMSCreditsModal from "./modals/SMSCreditsModal";
import SMSHistoryModal from "./modals/SMSHistoryModal";
import WeekendEventModal from "./modals/WeekendEventModal";
import MonthlyReportModal from "./modals/MonthlyReportModal";

// Lines 35-165: Enhanced Main Dashboard Component - Phase 2 Integration + Training Sessions
export default function DashboardPage() {
  const { user, token } = useAuth();
  const { showSuccess, showError } = useToast();

  // State management - Comprehensive modal and view state (PRESERVED)
  const [currentView, setCurrentView] = useState("dashboard");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [addStudentModalOpen, setAddStudentModalOpen] = useState(false);
  const [smsCreditsModalOpen, setSmsCreditsModalOpen] = useState(false);
  const [smsHistoryModalOpen, setSmsHistoryModalOpen] = useState(false);
  const [weekendEventModalOpen, setWeekendEventModalOpen] = useState(false);
  const [monthlyReportModalOpen, setMonthlyReportModalOpen] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [smsLoading, setSmsLoading] = useState(false);

  // API data hooks - Enhanced error handling (PRESERVED)
  const { 
    dashboardData, 
    students, 
    setStudents, 
    loading, 
    error, 
    refetch 
  } = useDashboardData(token);

  // Enhanced student management hook - All student operations (PRESERVED)
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

  // Modal handlers - All preserved functionality
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

  // NEW: Training session success handler
  const handleTrainingSessionSuccess = useCallback((message) => {
    showSuccess(message);
    // Optionally refetch data to update training status
    refetch();
  }, [showSuccess, refetch]);

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
      console.error("SMS reminder error:", error);
      
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

  // PHASE 2: Loading state using extracted component
  if (loading) {
    return <LoadingView />;
  }

  // PHASE 2: Error state using extracted component
  if (error) {
    return <ErrorView error={error} onRetry={refetch} />;
  }

  // PHASE 2: Profile view using extracted component
  if (currentView === "profile" && selectedStudent) {
    return (
      <ProfileView
        user={user}
        selectedStudent={selectedStudent}
        onBack={handleBackToDashboard}
        onEdit={handleEditStudent}
        onRefresh={refetch}
        onOpenCredits={() => setSmsCreditsModalOpen(true)}
        onOpenHistory={() => setSmsHistoryModalOpen(true)}
        onOpenWeekendEvent={handleOpenWeekendEventModal}
        onOpenMonthlyReport={handleOpenMonthlyReportModal}
        loading={loading}
      />
    );
  }

  // PHASE 2: Edit view using extracted component
  if (currentView === "edit" && selectedStudent) {
    return (
      <EditView
        user={user}
        selectedStudent={selectedStudent}
        onBack={() => setCurrentView("profile")}
        onSave={handleEditSave}
        onRefresh={refetch}
        onOpenCredits={() => setSmsCreditsModalOpen(true)}
        onOpenHistory={() => setSmsHistoryModalOpen(true)}
        onOpenWeekendEvent={handleOpenWeekendEventModal}
        onOpenMonthlyReport={handleOpenMonthlyReportModal}
        loading={loading}
      />
    );
  }

  // PHASE 2: Main dashboard view using extracted components
  return (
    <div className="min-h-screen bg-gray-900">
      {/* PHASE 2: Extracted Header Component */}
      <DashboardHeader 
        user={user}
        onRefresh={refetch}
        onOpenCredits={() => setSmsCreditsModalOpen(true)}
        onOpenHistory={() => setSmsHistoryModalOpen(true)}
        onOpenWeekendEvent={handleOpenWeekendEventModal}
        onOpenMonthlyReport={handleOpenMonthlyReportModal}
        loading={loading}
      />

      <main className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Announcements Banner - PRESERVED */}
          {announcements.length > 0 && (
            <AnnouncementBanner 
              announcements={announcements}
              onDismiss={handleDismissAnnouncement}
              onEdit={handleEditAnnouncement}
            />
          )}

          {/* PHASE 2: Extracted Statistics Component */}
          <DashboardStatistics 
            dashboardData={dashboardData}
            students={students}
            tabCounts={tabCounts}
            pricingBreakdown={revenueData}
          />

          {/* ENHANCED: Student Management Section with Training Session Integration */}
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
              onTrainingSessionSuccess={handleTrainingSessionSuccess}
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