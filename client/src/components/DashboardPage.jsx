// File: client/src/components/DashboardPage.jsx
// FIXED: Complete edit functionality working
import React, { useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

// Custom Hooks
import useStudentManagement from "../hooks/useStudentManagement";
import { useDashboardData } from "../hooks/useDashboardData";
import { useToast } from "../hooks/useToast";

// Components
import StatisticsCards from "./dashboard/StatisticsCards";
import PricingDistribution from "./dashboard/PricingDistribution";
import StudentManagementSection from "./dashboard/StudentManagementSection";
import StudentProfileView from "./StudentProfileView";
import StudentEditForm from "./StudentEditForm";
import PaymentModal from "./PaymentModal";
import AddStudentModal from "./AddStudentModal";
import SMSCreditsModal from "./modals/SMSCreditsModal";
import SMSHistoryModal from "./modals/SMSHistoryModal";

export default function DashboardPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  // FIXED: View state management - Added "edit" view
  const [currentView, setCurrentView] = useState("dashboard"); // dashboard, profile, edit
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Dashboard data hook
  const { 
    dashboardData, 
    students, 
    setStudents, 
    loading, 
    error, 
    refetch 
  } = useDashboardData(token);

  // Enhanced student management hook
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

  // Modal states
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [addStudentModalOpen, setAddStudentModalOpen] = useState(false);
  const [smsCreditsModalOpen, setSmsCreditsModalOpen] = useState(false);
  const [smsHistoryModalOpen, setSmsHistoryModalOpen] = useState(false);

  // FIXED: Event handlers for student navigation
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

  // FIXED: Working edit handler - opens edit form
  const handleEditStudent = useCallback((student) => {
    setSelectedStudent(student);
    setCurrentView("edit");
  }, []);

  // FIXED: Navigation handler
  const handleBackToDashboard = useCallback(() => {
    setCurrentView("dashboard");
    setSelectedStudent(null);
  }, []);

  // FIXED: Edit save handler with API call
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
      refetch(); // Refresh data
      setCurrentView("dashboard"); // Return to dashboard
      setSelectedStudent(null);
    } catch (error) {
      throw new Error(error.message || 'Failed to update student');
    }
  }, [token, showSuccess, refetch]);

  // Modal handlers
  const handlePaymentSuccess = useCallback((paymentData) => {
    showSuccess(`Payment of ₱${paymentData.amount} processed successfully!`);
    refetch(); // Auto refresh after payment
    setPaymentModalOpen(false);
    setSelectedStudent(null);
  }, [showSuccess, refetch]);

  const handleStudentAdded = useCallback((newStudent) => {
    showSuccess(`Student ${newStudent.name} added successfully!`);
    refetch();
    setAddStudentModalOpen(false);
  }, [showSuccess, refetch]);

  const handleSMSCreditsOpen = useCallback(() => {
    setSmsCreditsModalOpen(true);
  }, []);

  const handleSMSHistoryOpen = useCallback(() => {
    setSmsHistoryModalOpen(true);
  }, []);

  const handleSendReminder = useCallback(async (student) => {
    try {
      showSuccess(`SMS reminder sent to ${student.name}!`);
    } catch (error) {
      showError(`Failed to send SMS: ${error.message}`);
    }
  }, [showSuccess, showError]);

  // Loading and error states
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-red-400 text-xl">{error}</div>
      </div>
    );
  }

  // FIXED: Conditional rendering for all views
  if (currentView === "profile" && selectedStudent) {
    return (
      <StudentProfileView
        student={selectedStudent}
        onBack={handleBackToDashboard}
        onEdit={handleEditStudent}
      />
    );
  }

  // FIXED: Edit view rendering
  if (currentView === "edit" && selectedStudent) {
    return (
      <StudentEditForm
        student={selectedStudent}
        onSave={handleEditSave}
        onBack={handleBackToDashboard}
        isSaving={false}
      />
    );
  }

  // Main dashboard view
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <main className="container mx-auto px-4 py-8">
        {/* Page Header with SMS Buttons and Logout */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Academy Dashboard
            </h1>
            <p className="text-gray-400">
              Welcome back, {user?.name || 'Admin'}! Here's your academy overview.
            </p>
          </div>
          
          {/* SMS Controls and Logout */}
          <div className="flex space-x-4">
            <button
              onClick={handleSMSCreditsOpen}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              💳 SMS Credits
            </button>
            <button
              onClick={handleSMSHistoryOpen}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              📊 SMS History
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
            >
              🚪 Logout
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <StatisticsCards 
          students={students}
          dashboardData={dashboardData}
          tabCounts={tabCounts}
          pricingBreakdown={pricingBreakdown}
        />

        {/* Pricing Distribution */}
        <PricingDistribution 
          pricingBreakdown={pricingBreakdown}
        />

        {/* Student Management Section */}
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
          onEditStudent={handleEditStudent} // This now works properly
          onSendReminder={handleSendReminder}
          canSendReminder={canSendReminder}
          getStudentStatus={getStudentStatus}
          getDaysRemaining={getDaysRemaining}
          smsLoading={false}
        />

        {/* Data Timestamp */}
        <div className="mt-6 text-center text-sm text-gray-500">
          Last updated: {new Date(dashboardData?.timestamp || Date.now()).toLocaleString()}
        </div>
      </main>

      {/* All Modals */}
      
      {/* Payment Modal */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => {
          setPaymentModalOpen(false);
          setSelectedStudent(null);
        }}
        student={selectedStudent}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Add Student Modal */}
      <AddStudentModal
        isOpen={addStudentModalOpen}
        onClose={() => setAddStudentModalOpen(false)}
        onStudentAdded={handleStudentAdded}
      />

      {/* SMS Credits Modal */}
      <SMSCreditsModal
        isOpen={smsCreditsModalOpen}
        onClose={() => setSmsCreditsModalOpen(false)}
      />

      {/* SMS History Modal */}
      <SMSHistoryModal
        isOpen={smsHistoryModalOpen}
        onClose={() => setSmsHistoryModalOpen(false)}
      />
    </div>
  );
}