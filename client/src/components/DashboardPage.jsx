// File: client/src/components/DashboardPage.jsx
// FIXED: Now actually USING ModalContainer and StatisticsCards components you created

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/useToast";
import useStudentManagement from "../hooks/useStudentManagement";
import StudentManagementSection from "./dashboard/StudentManagementSection";
import StudentProfileView from "./StudentProfileView";

// PHASE 3: Using YOUR created components
import StatisticsCards from "./dashboard/StatisticsCards";
import ModalContainer from "./dashboard/ModalContainer";

// PHASE 2 IMPORTS - Extracted hooks
import { validateStudentData } from "../utils/studentValidation";
import { calculateDashboardMetrics } from "../utils/dashboardMetrics";
import useModalManager from "../hooks/useModalManager";
import useStudentOperations from "../hooks/useStudentOperations";

const DashboardPage = () => {
  const { token, user, logout } = useAuth();
  const { showSuccess, showError } = useToast();

  // Core state (REDUCED - modals moved to hook)
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [smsLoading, setSmsLoading] = useState(false);

  // Enhanced data fetching (MOVED UP before hook usage)
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

  // PHASE 2 ENHANCEMENT - Use extracted hooks
  const modalManager = useModalManager();
  const studentOps = useStudentOperations(token, showSuccess, showError, fetchStudents);

  // Custom hook usage (PRESERVED)
  const {
    currentTab, searchQuery, isSearchActive,
    filteredStudents, tabCounts, pricingBreakdown,
    getStudentStatus, getDaysRemaining, canSendReminder,
    setCurrentTab, setSearchQuery, setIsSearchActive, clearSearch
  } = useStudentManagement(students);

  // Effect hook (PRESERVED)
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Dashboard metrics (PRESERVED)
  const dashboardMetrics = useMemo(() => 
    calculateDashboardMetrics(students, tabCounts, pricingBreakdown),
    [students, tabCounts, pricingBreakdown]
  );

  // SIMPLIFIED handlers using extracted operations
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

  // SMS operations (PRESERVED but simplified)
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

  // SIMPLIFIED utility handlers
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

  // Early return for profile view (PRESERVED)
  if (viewingStudent) {
    return (
      <StudentProfileView
        student={viewingStudent}
        onBack={handleBackFromProfile}
        onEdit={handleEditStudent}
      />
    );
  }

  // Main render - NOW USING YOUR COMPONENTS
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
        
        {/* USING YOUR StatisticsCards component */}
        <StatisticsCards
          students={students}
          dashboardData={{ pricingBreakdown }}
          tabCounts={tabCounts}
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

      {/* USING YOUR ModalContainer component */}
      <ModalContainer
        modals={modalManager.modals}
        selectedData={modalManager.selectedData}
        handlers={{
          ...modalManager,
          handleAddStudent: studentOps.handleAddStudent,
          handleSaveStudent: studentOps.handleSaveStudent,
          onPaymentSuccess: handlePaymentSuccess,
          onTrainingSuccess: handleTrainingSuccess
        }}
        students={students}
      />
    </div>
  );
};

export default DashboardPage;