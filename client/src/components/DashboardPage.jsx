// File: client/src/components/DashboardPage.jsx
// Line 1: ENHANCED - Dashboard with Student Data Passing for Selective Messaging
import React, { useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

// Custom Hooks
import useStudentManagement from "../hooks/useStudentManagement";
import { useDashboardData } from "../hooks/useDashboardData";
import { useToast } from "../hooks/useToast";

// Existing Components
import StatisticsCards from "./dashboard/StatisticsCards";
import PricingDistribution from "./dashboard/PricingDistribution";
import StudentManagementSection from "./dashboard/StudentManagementSection";
import StudentProfileView from "./StudentProfileView";
import StudentEditForm from "./StudentEditForm";
import PaymentModal from "./PaymentModal";
import AddStudentModal from "./AddStudentModal";
import SMSCreditsModal from "./modals/SMSCreditsModal";
import SMSHistoryModal from "./modals/SMSHistoryModal";

// Enhanced Weekend Event Components
import WeekendEventModal from "./modals/WeekendEventModal";
import AnnouncementBanner from "./dashboard/AnnouncementBanner";

// FIXED: Import missing LogoutButton component
import LogoutButton from "./LogoutButton";

export default function DashboardPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  // Existing state management
  const [currentView, setCurrentView] = useState("dashboard");
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Existing modals
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [addStudentModalOpen, setAddStudentModalOpen] = useState(false);
  const [smsCreditsModalOpen, setSmsCreditsModalOpen] = useState(false);
  const [smsHistoryModalOpen, setSmsHistoryModalOpen] = useState(false);

  // ENHANCED: Weekend Event Modal State
  const [weekendEventModalOpen, setWeekendEventModalOpen] = useState(false);

  // Announcements State
  const [announcements, setAnnouncements] = useState([]);

  // SMS Loading State
  const [smsLoading, setSmsLoading] = useState(false);

  // Dashboard data hook
  const { 
    dashboardData, 
    students, 
    setStudents, 
    loading, 
    error, 
    refetch 
  } = useDashboardData(token);

  // Student management hook
  const {
    currentTab,
    searchQuery,
    isSearchActive,
    filteredStudents,
    tabCounts,
    pricingBreakdown,
    getStudentStatus,
    getDaysRemaining,
    canSendReminder,
    setCurrentTab,
    setSearchQuery,
    setIsSearchActive,
    clearSearch
  } = useStudentManagement(students);

  // Existing event handlers (unchanged)
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

      const updatedStudent = await response.json();
      
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

  // SMS Reminder Handler (unchanged)
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

    // Check if student is eligible for reminder
    if (!canSendReminder(student)) {
      const status = getStudentStatus(student);
      showError(`Cannot send reminder to ${student.name}. Status: ${status}`);
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
      
      // Enhanced error handling with specific messages
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
  }, [token, showSuccess, showError, smsLoading, canSendReminder, getStudentStatus]);

  // ENHANCED: Weekend Event Handlers with Student Data Passing
  const handleOpenWeekendEventModal = useCallback(() => {
    setWeekendEventModalOpen(true);
  }, []);

  const handleEventCreated = useCallback((eventData) => {
    // Add new announcement to the top of the list
    setAnnouncements(prev => [eventData, ...prev]);
    
    // Show enhanced success notification with detailed SMS info
    let successMessage = `Weekend event "${eventData.title}" created successfully!`;
    
    if (eventData.sendSMS && eventData.estimatedReach > 0) {
      successMessage += ` SMS sent to ${eventData.estimatedReach} selected students (₱${eventData.estimatedCost})`;
    }
    
    showSuccess(successMessage);
  }, [showSuccess]);

  const handleDismissAnnouncement = useCallback((announcementId) => {
    setAnnouncements(prev => prev.filter(announcement => 
      (announcement.id || announcement.index) !== announcementId
    ));
  }, []);

  const handleEditAnnouncement = useCallback((announcement) => {
    // Future: Open edit modal with pre-filled data
    showSuccess('Edit functionality will be available in the next update');
  }, [showSuccess]);

  // Loading and error states
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h2 className="text-xl font-semibold text-gray-100 mb-2">Dashboard Error</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Profile view
  if (currentView === "profile" && selectedStudent) {
    return (
      <StudentProfileView
        student={selectedStudent}
        onBack={handleBackToDashboard}
        onEdit={handleEditStudent}
      />
    );
  }

  // Edit view
  if (currentView === "edit" && selectedStudent) {
    return (
      <StudentEditForm
        student={selectedStudent}
        onBack={handleBackToDashboard}
        onSave={handleEditSave}
      />
    );
  }

  // Main dashboard view
  return (
    <div className="min-h-screen bg-gray-900">
      {/* ENHANCED: Header with improved Weekend Event Button */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Student Membership Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Welcome back, {user?.email}</p>
            </div>
            <div className="flex items-center gap-3">
              {/* ENHANCED: Weekend Event Button with Better Styling */}
              <button
                onClick={handleOpenWeekendEventModal}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 transform hover:scale-105 shadow-lg"
                title="Create Weekend Event with Selective Messaging"
              >
                <span className="mr-2">📅</span>
                <span className="hidden sm:inline">Weekend Event</span>
                <span className="sm:hidden">Event</span>
              </button>
              
              {/* Existing SMS Buttons */}
              <button
                onClick={() => setSmsCreditsModalOpen(true)}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <span className="mr-2">💳</span>
                <span className="hidden sm:inline">Credits</span>
              </button>
              <button
                onClick={() => setSmsHistoryModalOpen(true)}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <span className="mr-2">📊</span>
                <span className="hidden sm:inline">History</span>
              </button>
              
              {/* Existing refresh button */}
              <button
                onClick={refetch}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span className="hidden sm:inline">Refresh Data</span>
                <span className="sm:hidden">🔄</span>
              </button>
              
              {/* FIXED: Add missing logout button */}
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="min-h-screen bg-gray-900">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Announcement Banner */}
          <AnnouncementBanner 
            announcements={announcements}
            onDismiss={handleDismissAnnouncement}
            onEdit={handleEditAnnouncement}
          />

          {/* Existing Components */}
          <StatisticsCards 
            students={students}
            dashboardData={dashboardData}
            tabCounts={tabCounts}
            pricingBreakdown={pricingBreakdown}
          />

          <PricingDistribution 
            pricingBreakdown={pricingBreakdown}
          />

          {/* Student Management Section with SMS Integration */}
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
            getStudentStatus={getStudentStatus}
            getDaysRemaining={getDaysRemaining}
            smsLoading={smsLoading}
          />

          <div className="mt-6 text-center text-sm text-gray-400">
            Last updated: {new Date(dashboardData?.timestamp || Date.now()).toLocaleString()}
          </div>
        </main>
      </div>

      {/* Existing Modals */}
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

      {/* ENHANCED: Weekend Event Modal with Student Data */}
      <WeekendEventModal
        isOpen={weekendEventModalOpen}
        onClose={() => setWeekendEventModalOpen(false)}
        onEventCreated={handleEventCreated}
        existingEvents={announcements}
        students={students} // CRITICAL: Pass complete student data for recipient calculation
      />
    </div>
  );
}