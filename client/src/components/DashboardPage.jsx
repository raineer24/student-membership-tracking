// File: client/src/components/DashboardPage.jsx
// Phase 2: Enhanced with modal and student operations hooks
// Clear line guidance: Reduced complexity by extracting modal and operation logic

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

// Lines 20-24: PHASE 2 NEW IMPORTS - Extracted hooks
import { validateStudentData } from "../utils/studentValidation";
import { calculateDashboardMetrics } from "../utils/dashboardMetrics";
import useModalManager from "../hooks/useModalManager";
import useStudentOperations from "../hooks/useStudentOperations";

const DashboardPage = () => {
  const { token, user, logout } = useAuth();
  const { showSuccess, showError } = useToast();

  // Lines 30-34: Core state (REDUCED - modals moved to hook)
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [smsLoading, setSmsLoading] = useState(false);

  // Lines 36-75: Enhanced data fetching (MOVED UP before hook usage)
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

  // Lines 77-80: PHASE 2 ENHANCEMENT - Use extracted hooks
  const modalManager = useModalManager();
  const studentOps = useStudentOperations(token, showSuccess, showError, fetchStudents);

  // Lines 82-87: Custom hook usage (PRESERVED)
  const {
    currentTab, searchQuery, isSearchActive,
    filteredStudents, tabCounts, pricingBreakdown,
    getStudentStatus, getDaysRemaining, canSendReminder,
    setCurrentTab, setSearchQuery, setIsSearchActive, clearSearch
  } = useStudentManagement(students);

  // Lines 89-91: Effect hook (PRESERVED)
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Lines 93-97: Dashboard metrics (PRESERVED)
  const dashboardMetrics = useMemo(() => 
    calculateDashboardMetrics(students, tabCounts, pricingBreakdown),
    [students, tabCounts, pricingBreakdown]
  );

  // Lines 99-112: SIMPLIFIED handlers using extracted operations
  const handleEditStudent = useCallback((student) => {
    if (!student) return;
    setViewingStudent(null);
    setTimeout(() => modalManager.openEditStudent(student), 50);
  }, [modalManager]);

  const handleViewStudent = useCallback((studentId) => {
    const student = studentOps.handleViewStudent(studentId, students);
    if (student) setViewingStudent(student);
  }, [studentOps, students]);

  const handleLogTraining = useCallback((student) => {
    const validStudent = studentOps.handleLogTraining(student);
    if (validStudent) modalManager.openTraining(validStudent);
  }, [studentOps, modalManager]);

  // Lines 114-132: SMS operations (PRESERVED but simplified)
  const handleSendReminder = useCallback(async (student) => {
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

      showSuccess(`SMS reminder sent to ${student.name}`);
    } catch (error) {
      showError(`Failed to send SMS: ${error.message}`);
    } finally {
      setSmsLoading(false);
    }
  }, [token, showSuccess, showError]);

  // Lines 134-152: SIMPLIFIED utility handlers
  const handleRefreshData = useCallback(async () => {
    showSuccess("Refreshing dashboard data...");
    await fetchStudents();
    showSuccess("Dashboard data refreshed!");
  }, [fetchStudents, showSuccess]);

  const handleBackFromProfile = useCallback(() => {
    setViewingStudent(null);
    if (modalManager.modals.editStudent) {
      modalManager.closeEditStudent();
    }
  }, [modalManager]);

  const handlePaymentSuccess = useCallback((paymentData) => {
    showSuccess(`Payment of ₱${paymentData.amount} processed successfully!`);
    fetchStudents();
    modalManager.closePayment();
  }, [showSuccess, fetchStudents, modalManager]);

  const handleTrainingSuccess = useCallback((message) => {
    showSuccess(message);
    fetchStudents();
    modalManager.closeTraining();
  }, [showSuccess, fetchStudents, modalManager]);

  // Lines 154-162: Early return for profile view (PRESERVED)
  if (viewingStudent) {
    return (
      <StudentProfileView
        student={viewingStudent}
        onBack={handleBackFromProfile}
        onEdit={handleEditStudent}
      />
    );
  }

  // Lines 164-262: Main render (PRESERVED with hook integration)
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
                onClick={modalManager.openMonthlyReport}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <span>📊</span>
                <span className="hidden sm:inline">Monthly Report</span>
              </button>
              
              <button
                onClick={modalManager.openWeekendEvent}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <span>🥋</span>
                <span className="hidden sm:inline">Weekend Event</span>
              </button>
              
              <button
                onClick={modalManager.openCredits}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <span>💳</span>
                <span className="hidden sm:inline">Credits</span>
              </button>
              
              <button
                onClick={modalManager.openHistory}
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
        
        {/* Dashboard Metrics */}
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
          setAddStudentModalOpen={modalManager.openAddStudent}
          onProcessPayment={(student) => modalManager.openPayment(student)}
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

      {/* MODALS - SIMPLIFIED with hook integration */}
      <AddStudentModal
        isOpen={modalManager.modals.addStudent}
        onClose={modalManager.closeAddStudent}
        onStudentAdded={studentOps.handleAddStudent}
      />

      {modalManager.modals.editStudent && modalManager.selectedData.editingStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl border border-gray-600 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white">Edit Student Profile</h2>
              <button
                onClick={modalManager.closeEditStudent}
                className="text-gray-400 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>
            <div className="p-0">
              <StudentEditForm
                student={modalManager.selectedData.editingStudent}
                onSave={studentOps.handleSaveStudent}
                onBack={modalManager.closeEditStudent}
                isModal={true}
              />
            </div>
          </div>
        </div>
      )}

      <PaymentModal
        isOpen={modalManager.modals.payment}
        onClose={modalManager.closePayment}
        student={modalManager.selectedData.paymentStudent}
        onPaymentSuccess={handlePaymentSuccess}
      />

      <TrainingSessionModal
        isOpen={modalManager.modals.training}
        onClose={modalManager.closeTraining}
        students={students}
        selectedStudent={modalManager.selectedData.trainingStudent}
        onSuccess={handleTrainingSuccess}
      />

      <SMSCreditsModal
        isOpen={modalManager.modals.credits}
        onClose={modalManager.closeCredits}
      />

      <SMSHistoryModal
        isOpen={modalManager.modals.history}
        onClose={modalManager.closeHistory}
      />

      <WeekendEventModal
        isOpen={modalManager.modals.weekendEvent}
        onClose={modalManager.closeWeekendEvent}
        students={students}
      />

      <MonthlyReportModal
        isOpen={modalManager.modals.monthlyReport}
        onClose={modalManager.closeMonthlyReport}
        students={students}
      />
    </div>
  );
};

export default DashboardPage;