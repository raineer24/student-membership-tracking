// File: client/src/components/DashboardPage.jsx
// Enhanced with imported utilities while preserving ALL existing functionality
// Clear line guidance: Updated imports and function usage

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/useToast";
import useStudentManagement from "../hooks/useStudentManagement";
import StudentManagementSection from "./dashboard/StudentManagementSection";
import StudentProfileView from "./StudentProfileView";
import StudentEditForm from "./StudentEditForm";

// Modal imports
import AddStudentModal from "./AddStudentModal";
import PaymentModal from "./PaymentModal";
import SMSCreditsModal from "./modals/SMSCreditsModal";
import SMSHistoryModal from "./modals/SMSHistoryModal";
import WeekendEventModal from "./modals/WeekendEventModal";
import MonthlyReportModal from "./modals/MonthlyReportModal";
import TrainingSessionModal from "./training/TrainingSessionModal";

// Lines 14-15: NEW IMPORTS - Pure utility functions
import { validateStudentData } from "../utils/studentValidation";
import { calculateDashboardMetrics } from "../utils/dashboardMetrics";

const DashboardPage = () => {
  const { token, user, logout } = useAuth();
  const { showSuccess, showError } = useToast();

  // Lines 22-36: State management (PRESERVED)
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [addStudentModalOpen, setAddStudentModalOpen] = useState(false);
  const [editStudentModalOpen, setEditStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentStudent, setPaymentStudent] = useState(null);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [monthlyReportModalOpen, setMonthlyReportModalOpen] = useState(false);
  const [weekendEventModalOpen, setWeekendEventModalOpen] = useState(false);
  const [creditsModalOpen, setCreditsModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [smsLoading, setSmsLoading] = useState(false);
  const [trainingModalOpen, setTrainingModalOpen] = useState(false);
  const [trainingStudent, setTrainingStudent] = useState(null);

  // Lines 34-39: Custom hook usage (PRESERVED)
  const {
    currentTab, searchQuery, isSearchActive,
    filteredStudents, tabCounts, pricingBreakdown,
    getStudentStatus, getDaysRemaining, canSendReminder,
    setCurrentTab, setSearchQuery, setIsSearchActive, clearSearch
  } = useStudentManagement(students);

  // Lines 41-65: Enhanced data fetching with validation utility
  const fetchStudents = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/students", {
        method: "GET",
        headers: { 
          Authorization: `Bearer ${token}`, 
          "Content-Type": "application/json" 
        },
      });

      if (!response.ok) {
        if (response.status === 401) { 
          logout(); 
          return; 
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const rawData = await response.json();
      // Lines 61-62: ENHANCED - Use validation utility
      const validatedStudents = validateStudentData(rawData);
      setStudents(validatedStudents);
      
    } catch (error) {
      setError(error.message);
      setStudents([]);
      showError(`Failed to load students: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [token, logout, showError]);

  // Lines 72-74: Effect hook (PRESERVED)
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Lines 76-82: ENHANCED - Use metrics calculation utility
  const dashboardMetrics = useMemo(() => 
    calculateDashboardMetrics(students, tabCounts, pricingBreakdown),
    [students, tabCounts, pricingBreakdown]
  );

  // Lines 84-118: Enhanced handlers (PRESERVED functionality)
  const handleEditStudent = useCallback((student) => {
    if (!student || typeof student !== 'object') {
      showError("Invalid student data");
      return;
    }

    // Close profile view first, then open edit modal
    setViewingStudent(null);
    
    setTimeout(() => {
      setEditingStudent(student);
      setEditStudentModalOpen(true);
    }, 50);
  }, [showError]);

  const handleSaveStudent = useCallback(async (updatedStudentData) => {
    if (!updatedStudentData || !updatedStudentData.id) {
      showError("Invalid student data for update");
      return;
    }

    try {
      const response = await fetch(`/api/students/${updatedStudentData.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: updatedStudentData.name,
          email: updatedStudentData.email,
          phone: updatedStudentData.phone,
          age: updatedStudentData.age,
          parent: updatedStudentData.parent,
          monthlyRate: parseFloat(updatedStudentData.monthlyRate || 1400),
          isLegacyStudent: Boolean(updatedStudentData.isLegacyStudent)
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
      }

      const result = await response.json();
      showSuccess(`Student ${updatedStudentData.name} updated successfully!`);
      
      await fetchStudents();
      setEditStudentModalOpen(false);
      setEditingStudent(null);
      
      return result;
    } catch (error) {
      showError(`Failed to update student: ${error.message}`);
      throw error;
    }
  }, [token, showSuccess, showError, fetchStudents]);

  const handleAddStudent = async (studentData) => {
    try {
      const response = await fetch("/api/students", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(studentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add student");
      }

      const result = await response.json();
      showSuccess(`Student ${result.name} added successfully!`);
      await fetchStudents();
      setAddStudentModalOpen(false);
      return result;
    } catch (error) {
      showError(`Failed to add student: ${error.message}`);
      throw error;
    }
  };

  const handleProcessPayment = useCallback((student) => {
    if (!student || typeof student !== 'object') {
      return;
    }
    setPaymentStudent(student);
    setPaymentModalOpen(true);
  }, []);

  // Lines 119-140: View and navigation handlers (PRESERVED)
  const handleViewStudent = useCallback((studentId) => {
    if (!studentId) {
      return;
    }
    
    const student = students.find(s => s && s.id === studentId);
      
    if (student) {
      setViewingStudent(student);
    } else {
      showError("Student not found");
    }
  }, [students, showError]);

  const handleBackFromProfile = useCallback(() => {
    setViewingStudent(null);
    
    if (editStudentModalOpen || editingStudent) {
      setEditStudentModalOpen(false);
      setEditingStudent(null);
    }
  }, [editStudentModalOpen, editingStudent]);

  // Lines 142-160: Training and SMS handlers (PRESERVED)
  const handleLogTraining = useCallback((student) => {
    if (!student || typeof student !== 'object') {
      showError("Invalid student data");
      return;
    }
    setTrainingStudent(student);
    setTrainingModalOpen(true);
  }, [showError]);

  const handleTrainingSuccess = useCallback((message) => {
    showSuccess(message);
    fetchStudents();
    setTrainingModalOpen(false);
    setTrainingStudent(null);
  }, [showSuccess, fetchStudents]);

  const handleSendReminder = async (student) => {
    setSmsLoading(true);
    try {
      const response = await fetch("/api/reminders/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId: student.id,
          testMode: process.env.NODE_ENV === "development"
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send SMS");
      }

      const result = await response.json();
      showSuccess(`SMS reminder sent to ${student.name}`);
      return result;
    } catch (error) {
      console.error("Error sending SMS:", error);
      showError(`Failed to send SMS: ${error.message}`);
    } finally {
      setSmsLoading(false);
    }
  };

  // Lines 162-185: Modal handlers (MOVED BEFORE RENDER)
  const handleRefreshData = useCallback(async () => {
    showSuccess("Refreshing dashboard data...");
    await fetchStudents();
    showSuccess("Dashboard data refreshed!");
  }, [fetchStudents, showSuccess]);

  const handleOpenMonthlyReport = useCallback(() => setMonthlyReportModalOpen(true), []);
  const handleCloseMonthlyReport = useCallback(() => setMonthlyReportModalOpen(false), []);
  const handleOpenWeekendEvent = useCallback(() => setWeekendEventModalOpen(true), []);
  const handleCloseWeekendEvent = useCallback(() => setWeekendEventModalOpen(false), []);
  const handleOpenCredits = useCallback(() => setCreditsModalOpen(true), []);
  const handleCloseCredits = useCallback(() => setCreditsModalOpen(false), []);
  const handleOpenHistory = useCallback(() => setHistoryModalOpen(true), []);
  const handleCloseHistory = useCallback(() => setHistoryModalOpen(false), []);

  const handlePaymentSuccess = useCallback((paymentData) => {
    showSuccess(`Payment of ₱${paymentData.amount} processed successfully!`);
    fetchStudents();
    setPaymentModalOpen(false);
    setPaymentStudent(null);
  }, [showSuccess, fetchStudents]);



  // Lines 177-185: Success handlers (PRESERVED)
  const handleAddStudentSuccess = useCallback(() => {
    setAddStudentModalOpen(false);
    fetchStudents();
  }, [fetchStudents]);

  const handleEditStudentSuccess = useCallback(() => {
    setEditStudentModalOpen(false);
    setEditingStudent(null);
    fetchStudents();
  }, [fetchStudents]);

  const handleTrainingSessionSuccess = useCallback(() => {
    setTrainingModalOpen(false);
    setTrainingStudent(null);
    fetchStudents();
  }, [fetchStudents]);

  // Lines 222-228: Early return for profile view (PRESERVED)
  if (viewingStudent) {
    return (
      <StudentProfileView
        student={viewingStudent}
        onBack={handleBackFromProfile}
        onEdit={handleEditStudent}
      />
    );
  }

  // Lines 206-300: Main render (PRESERVED with metrics enhancement)
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 shadow-xl border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-white">
                Student Membership Dashboard
              </h1>
              <p className="text-gray-400 mt-1">Welcome back, {user?.email || 'Admin'}</p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleOpenMonthlyReport}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <span>📊</span>
                <span className="hidden sm:inline">Monthly Report</span>
              </button>
              
              <button
                onClick={handleOpenWeekendEvent}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <span>🥋</span>
                <span className="hidden sm:inline">Weekend Event</span>
              </button>
              
              <button
                onClick={handleOpenCredits}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <span>💳</span>
                <span className="hidden sm:inline">Credits</span>
              </button>
              
              <button
                onClick={handleOpenHistory}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <span>📱</span>
                <span className="hidden sm:inline">History</span>
              </button>
              
              <button
                onClick={handleRefreshData}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <span>🔄</span>
                <span className="hidden sm:inline">Refresh Data</span>
              </button>
              
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Dashboard Metrics - ENHANCED with utility function */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {dashboardMetrics.totalStudents}
                </h3>
                <p className="text-gray-400 text-sm">Total Students</p>
              </div>
              <span className="text-3xl">👥</span>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-green-400">
                  {dashboardMetrics.activeStudents}
                </h3>
                <p className="text-gray-400 text-sm">Active</p>
              </div>
              <span className="text-3xl">✅</span>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-yellow-400">
                  {dashboardMetrics.expiringStudents}
                </h3>
                <p className="text-gray-400 text-sm">Expiring Soon</p>
              </div>
              <span className="text-3xl">⚠️</span>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-red-400">
                  {dashboardMetrics.overdueStudents}
                </h3>
                <p className="text-gray-400 text-sm">Overdue</p>
              </div>
              <span className="text-3xl">🚨</span>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-green-400">
                  ₱{dashboardMetrics.monthlyRevenue.toLocaleString()}
                </h3>
                <p className="text-gray-400 text-sm">Monthly Revenue</p>
              </div>
              <span className="text-3xl">💰</span>
            </div>
          </div>
        </div>

        {/* Student Management Section - PRESERVED */}
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
          onLogTraining={handleLogTraining}
          canSendReminder={canSendReminder}
          getStudentStatus={getStudentStatus}
          getDaysRemaining={getDaysRemaining}
          smsLoading={smsLoading}
        />
      </main>

      {/* ALL MODALS - PRESERVED */}
      <AddStudentModal
        isOpen={addStudentModalOpen}
        onClose={() => setAddStudentModalOpen(false)}
        onStudentAdded={handleAddStudent}
      />

      {/* FIXED: Edit modal renders properly */}
      {editStudentModalOpen && editingStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl border border-gray-600 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white">Edit Student Profile</h2>
              <button
                onClick={() => {
                  setEditStudentModalOpen(false);
                  setEditingStudent(null);
                }}
                className="text-gray-400 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>
            <div className="p-0">
              <StudentEditForm
                student={editingStudent}
                onSave={handleSaveStudent}
                onBack={() => {
                  setEditStudentModalOpen(false);
                  setEditingStudent(null);
                }}
                isModal={true}
              />
            </div>
          </div>
        </div>
      )}

      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => {
          setPaymentModalOpen(false);
          setPaymentStudent(null);
        }}
        student={paymentStudent}
        onPaymentSuccess={handlePaymentSuccess}
      />

      <TrainingSessionModal
        isOpen={trainingModalOpen}
        onClose={() => {
          setTrainingModalOpen(false);
          setTrainingStudent(null);
        }}
        students={students}
        selectedStudent={trainingStudent}
        onSuccess={handleTrainingSuccess}
      />

      <SMSCreditsModal
        isOpen={creditsModalOpen}
        onClose={handleCloseCredits}
      />

      <SMSHistoryModal
        isOpen={historyModalOpen}
        onClose={handleCloseHistory}
      />

      <WeekendEventModal
        isOpen={weekendEventModalOpen}
        onClose={handleCloseWeekendEvent}
        students={students}
      />

      <MonthlyReportModal
        isOpen={monthlyReportModalOpen}
        onClose={handleCloseMonthlyReport}
        students={students}
      />
    </div>
  );
};

export default DashboardPage;