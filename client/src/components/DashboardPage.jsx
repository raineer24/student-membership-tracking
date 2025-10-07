// File: client/src/components/DashboardPage.jsx
// MINIMAL ENHANCEMENT: Only adds skeleton loading for better perceived performance
// Preserves ALL existing functionality exactly as-is

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/useToast";
import useStudentManagement from "../hooks/useStudentManagement";
import StudentManagementSection from "./dashboard/StudentManagementSection";
import StudentProfileView from "./StudentProfileView";
import StatisticsCards from "./dashboard/StatisticsCards";
import ModalContainer from "./dashboard/ModalContainer";
import { validateStudentData } from "../utils/studentValidation";
import { calculateDashboardMetrics } from "../utils/dashboardMetrics";
import useModalManager from "../hooks/useModalManager";
import useStudentOperations from "../hooks/useStudentOperations";

// NEW: Skeleton Loading Components for better UX while loading
const SkeletonCard = () => (
  <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="space-y-2 flex-1">
        <div className="h-8 bg-gray-700 rounded w-16"></div>
        <div className="h-4 bg-gray-700 rounded w-24"></div>
      </div>
      <div className="w-12 h-12 bg-gray-700 rounded-full"></div>
    </div>
  </div>
);

const SkeletonTable = () => (
  <div className="space-y-4">
    {[1, 2, 3, 4, 5].map(i => (
      <div key={i} className="bg-gray-800 rounded-lg p-4 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-700 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-700 rounded w-1/3"></div>
            <div className="h-3 bg-gray-700 rounded w-1/4"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

const DashboardPage = () => {
  const { token, user, logout } = useAuth();
  const { showSuccess, showError } = useToast();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [smsLoading, setSmsLoading] = useState(false);
  
  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const modalManager = useModalManager();
  const studentOps = useStudentOperations(token, showSuccess, showError, fetchStudents);

  const {
    currentTab, searchQuery, isSearchActive,
    filteredStudents, tabCounts, pricingBreakdown,
    getStudentStatus, getDaysRemaining, canSendReminder,
    setCurrentTab, setSearchQuery, setIsSearchActive, clearSearch
  } = useStudentManagement(students);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const dashboardMetrics = useMemo(() => 
    calculateDashboardMetrics(students, tabCounts, pricingBreakdown),
    [students, tabCounts, pricingBreakdown]
  );

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
    modalManager.closeBulkAttendance();
  }, [showSuccess, fetchStudents, modalManager]);

  // NEW: Enhanced loading state with skeleton UI
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <header className="bg-gray-800 shadow-xl border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="h-8 bg-gray-700 rounded w-64 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-700 rounded w-48 animate-pulse"></div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map(i => <SkeletonCard key={i} />)}
          </div>

          {/* Table Skeleton */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="h-6 bg-gray-700 rounded w-48 mb-6 animate-pulse"></div>
            <SkeletonTable />
          </div>
        </main>
      </div>
    );
  }

  // NEW: Enhanced error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 text-center max-w-md">
          <div className="text-red-400 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-2">Failed to Load Dashboard</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={fetchStudents}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  if (viewingStudent) {
    return (
      <StudentProfileView
        student={viewingStudent}
        onBack={handleBackFromProfile}
        onEdit={handleEditStudent}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Mobile Responsive Header */}
      <header className="bg-gray-800 shadow-xl border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            {/* Top Row: Title and Mobile Menu Button */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-white truncate">
                  Student Membership Dashboard
                </h1>
                <p className="text-gray-400 text-sm mt-1 truncate">
                  Welcome back, {user?.email || 'Admin'}
                </p>
              </div>
              
              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden ml-4 p-2 rounded-lg bg-gray-700 text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
            
            {/* Desktop Buttons - Hidden on Mobile */}
            <div className="hidden lg:flex items-center space-x-3">
              <button
                onClick={modalManager.openMonthlyReport}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <span>📊</span>
                <span>Monthly Report</span>
              </button>
              
              <button
                onClick={modalManager.openWeekendEvent}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <span>🥋</span>
                <span>Weekend Event</span>
              </button>
              
              <button
                onClick={modalManager.openBulkAttendance}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <span>📋</span>
                <span>Bulk Attendance</span>
              </button>
              
              <button
                onClick={modalManager.openCredits}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <span>💳</span>
                <span>Credits</span>
              </button>
              
              <button
                onClick={modalManager.openHistory}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <span>📱</span>
                <span>History</span>
              </button>
              
              <button
                onClick={handleRefreshData}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <span>🔄</span>
                <span>Refresh Data</span>
              </button>
              
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>

            {/* Mobile Menu - Slide Down */}
            {mobileMenuOpen && (
              <div className="lg:hidden mt-4 space-y-2 border-t border-gray-700 pt-4">
                <button
                  onClick={() => {
                    modalManager.openMonthlyReport();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <span>📊</span>
                  <span>Monthly Report</span>
                </button>
                
                <button
                  onClick={() => {
                    modalManager.openWeekendEvent();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <span>🥋</span>
                  <span>Weekend Event</span>
                </button>
                
                <button
                  onClick={() => {
                    modalManager.openBulkAttendance();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <span>📋</span>
                  <span>Bulk Attendance</span>
                </button>
                
                <button
                  onClick={() => {
                    modalManager.openCredits();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <span>💳</span>
                  <span>Credits</span>
                </button>
                
                <button
                  onClick={() => {
                    modalManager.openHistory();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <span>📱</span>
                  <span>History</span>
                </button>
                
                <button
                  onClick={() => {
                    handleRefreshData();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <span>🔄</span>
                  <span>Refresh Data</span>
                </button>
                
                <button
                  onClick={logout}
                  className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <StatisticsCards
          students={students}
          dashboardData={{ pricingBreakdown }}
          tabCounts={tabCounts}
          pricingBreakdown={pricingBreakdown}
        />

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