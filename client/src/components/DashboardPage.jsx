// File: client/src/components/DashboardPage.jsx
// Lines 1-30: Enhanced imports with Phase 1-4 components and hooks
import React, { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Phase 4: Custom hooks imports (NEW - extracted business logic)
import { useDashboardData } from '../hooks/useDashboardData';
import { useSMSOperations } from '../hooks/useSMSOperations';
import { useStudentManagement } from '../hooks/useStudentManagement';
import { useToast } from '../hooks/useToast';

// Phase 2: Modal component imports (extracted from original lines 21-176)
import SMSCreditsModal from './modals/SMSCreditsModal';
import SMSHistoryModal from './modals/SMSHistoryModal';

// Phase 3: Student component imports (extracted from original lines 177-370)
import StudentTableRow from './student/StudentTableRow';
import LogoutButton from './LogoutButton';

// Existing component imports
import StudentProfileView from './StudentProfileView';
import StudentEditForm from './StudentEditForm';
import PaymentModal from './PaymentModal';
import AddStudentModal from './AddStudentModal';

// Lines 35-85: Main Dashboard Component - SIGNIFICANTLY REDUCED from 1200+ to ~300 lines
export default function DashboardPage() {
  // Lines 40-45: Core hooks and authentication
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  // Lines 50-65: Phase 4 - Custom hooks integration (extracted complex logic)
  const { 
    dashboardData, 
    students, 
    setStudents,
    loading, 
    error, 
    isSaving,
    updateStudent,
    refetch 
  } = useDashboardData(token);

  const {
    creditsData,
    historyData,
    modalLoading,
    smsLoading,
    fetchSMSCredits,
    fetchSMSHistory,
    sendReminder
  } = useSMSOperations();

  const {
    currentTab,
    searchQuery,
    isSearchActive,
    filteredStudents,
    tabCounts,
    pricingBreakdown,
    getStudentStatus,
    canSendReminder,
    setCurrentTab,
    setSearchQuery,
    setIsSearchActive
  } = useStudentManagement(students);

  // Lines 70-85: Remaining local state (GREATLY REDUCED from original)
  const [activeView, setActiveView] = useState("dashboard");
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [studentToEdit, setStudentToEdit] = useState(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [addStudentModalOpen, setAddStudentModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [creditsModalOpen, setCreditsModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  // Lines 90-150: Simplified event handlers (business logic moved to hooks)
  const handleProcessPayment = useCallback((student) => {
    setSelectedStudent(student);
    setPaymentModalOpen(true);
  }, []);

  const handleViewStudent = useCallback((studentId) => {
    setSelectedStudentId(studentId);
    setActiveView("profile");
  }, []);

  const handleEditStudent = useCallback((student) => {
    setStudentToEdit(student);
    setActiveView("edit");
  }, []);

  const handleSaveStudent = useCallback(async (updatedStudent) => {
    try {
      await updateStudent(updatedStudent.id, updatedStudent);
      
      // Navigate back to dashboard and clear edit state
      setActiveView("dashboard");
      setSelectedStudentId(null);
      setStudentToEdit(null);
      
    } catch (error) {
      // Error handling is done in the hook
      console.error("Save student error:", error);
    }
  }, [updateStudent]);

  const handleSendReminder = useCallback(async (student) => {
    try {
      await sendReminder(student);
    } catch (error) {
      // Error handling is done in the hook
      console.error("Send reminder error:", error);
    }
  }, [sendReminder]);

  const handleBackToDashboard = useCallback(() => {
    setActiveView("dashboard");
    setSelectedStudentId(null);
    setStudentToEdit(null);
  }, []);

  const handleStudentAdded = useCallback(() => {
    refetch();
    setAddStudentModalOpen(false);
    showSuccess("Student added successfully!");
  }, [refetch, showSuccess]);

  // Lines 155-200: Enhanced loading state component
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading dashboard...</p>
          <p className="text-gray-400 text-sm mt-2">Fetching student data and analytics...</p>
        </div>
      </div>
    );
  }

  // Lines 205-240: Enhanced error state component
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-xl border border-gray-600 p-8 max-w-md text-center">
          <div className="text-red-500 mb-4">
            <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Error Loading Dashboard</h3>
          <p className="text-red-400 mb-6">{error}</p>
          <button
            onClick={refetch}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Lines 245-275: Conditional view rendering - Student Profile
  if (activeView === "profile" && selectedStudentId) {
    const selectedStudentData = students.find(s => s.id === selectedStudentId);
    
    if (!selectedStudentData) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
          <div className="bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-xl border border-gray-600 p-8 text-center">
            <h2 className="text-xl font-semibold text-white mb-2">Student Not Found</h2>
            <p className="text-gray-400 mb-4">The requested student could not be found.</p>
            <button
              onClick={handleBackToDashboard}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return (
      <StudentProfileView
        student={selectedStudentData}
        onBack={handleBackToDashboard}
        onProcessPayment={() => handleProcessPayment(selectedStudentData)}
        onEdit={() => handleEditStudent(selectedStudentData)}
      />
    );
  }

  // Lines 280-300: Conditional view rendering - Student Edit
  if (activeView === "edit" && studentToEdit) {
    return (
      <StudentEditForm
        student={studentToEdit}
        onSave={handleSaveStudent}
        onBack={handleBackToDashboard}
        isSaving={isSaving}
      />
    );
  }

  // Lines 305-900: Main dashboard JSX with enhanced layout
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Lines 310-360: Enhanced header with Phase 3 LogoutButton component */}
      <header className="bg-gray-800 bg-opacity-90 backdrop-blur-sm border-b border-gray-600 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white flex items-center">
                <span className="text-red-500 mr-2">🥋</span>
                Academy Dashboard
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Enhanced SMS functionality buttons */}
              <button
                onClick={() => {
                  setCreditsModalOpen(true);
                  fetchSMSCredits();
                }}
                className="flex items-center px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                title="View SMS Credits"
              >
                <span className="mr-2">💬</span>
                SMS Credits
              </button>
              
              <button
                onClick={() => {
                  setHistoryModalOpen(true);
                  fetchSMSHistory();
                }}
                className="flex items-center px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                title="View SMS History"
              >
                <span className="mr-2">📱</span>
                SMS History
              </button>
              
              {/* Phase 3: LogoutButton component */}
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      {/* Lines 365-500: Enhanced main content with statistics cards */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Statistics Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          {/* Total Students Card */}
          <div className="bg-gray-800 bg-opacity-90 backdrop-blur-sm overflow-hidden shadow-xl rounded-xl border border-gray-600">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-3xl">👥</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">Total Students</dt>
                    <dd className="text-3xl font-bold text-white">
                      {students?.length || dashboardData?.summary?.totalStudents || 0}
                    </dd>
                    <dd className="text-sm text-gray-500">All registered students</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Active Students Card */}
          <div className="bg-gray-800 bg-opacity-90 backdrop-blur-sm overflow-hidden shadow-xl rounded-xl border border-gray-600">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-3xl">✅</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">Active</dt>
                    <dd className="text-3xl font-bold text-green-400">{tabCounts.active || 0}</dd>
                    <dd className="text-sm text-gray-500">Currently enrolled</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Expiring Students Card */}
          <div className="bg-gray-800 bg-opacity-90 backdrop-blur-sm overflow-hidden shadow-xl rounded-xl border border-gray-600">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-3xl">⚠️</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">Expiring Soon</dt>
                    <dd className="text-3xl font-bold text-yellow-400">{tabCounts.expiring || 0}</dd>
                    <dd className="text-sm text-gray-500">Within 7 days</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Overdue Students Card */}
          <div className="bg-gray-800 bg-opacity-90 backdrop-blur-sm overflow-hidden shadow-xl rounded-xl border border-gray-600">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-3xl">🚨</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">Overdue</dt>
                    <dd className="text-3xl font-bold text-red-400">{tabCounts.overdue || 0}</dd>
                    <dd className="text-sm text-gray-500">Payment overdue</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Revenue Card */}
          <div className="bg-gray-800 bg-opacity-90 backdrop-blur-sm overflow-hidden shadow-xl rounded-xl border border-gray-600">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-3xl">💰</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">Monthly Revenue</dt>
                    <dd className="text-3xl font-bold text-green-400">
                      ${pricingBreakdown.totalMonthly?.toLocaleString() || 0}
                    </dd>
                    <dd className="text-sm text-gray-500">Expected monthly</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lines 505-580: Enhanced pricing breakdown section */}
        {pricingBreakdown.total > 0 && (
          <div className="bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-xl border border-gray-600 p-6 mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <span className="mr-2">📊</span>
              Pricing Distribution
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-purple-500 bg-opacity-20 rounded-lg border border-purple-500">
                <div className="text-2xl font-bold text-purple-400">
                  {pricingBreakdown.legacy || 0}
                </div>
                <div className="text-sm text-purple-300">Legacy Students</div>
                <div className="text-xs text-gray-400">
                  ${(pricingBreakdown.legacyRevenue || 0).toLocaleString()}/month
                </div>
              </div>
              <div className="text-center p-4 bg-blue-500 bg-opacity-20 rounded-lg border border-blue-500">
                <div className="text-2xl font-bold text-blue-400">
                  {pricingBreakdown.current || 0}
                </div>
                <div className="text-sm text-blue-300">Current Rate Students</div>
                <div className="text-xs text-gray-400">
                  ${(pricingBreakdown.currentRevenue || 0).toLocaleString()}/month
                </div>
              </div>
              <div className="text-center p-4 bg-green-500 bg-opacity-20 rounded-lg border border-green-500">
                <div className="text-2xl font-bold text-green-400">
                  ${(pricingBreakdown.totalMonthly || 0).toLocaleString()}
                </div>
                <div className="text-sm text-green-300">Total Monthly Revenue</div>
                <div className="text-xs text-gray-400">
                  Avg: ${pricingBreakdown.total > 0 ? Math.round(pricingBreakdown.totalMonthly / pricingBreakdown.total) : 0}/student
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lines 585-700: Enhanced student management section */}
        <div className="bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-xl border border-gray-600 overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-gray-600">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <span className="mr-2">👨‍🎓</span>
                Student Management
              </h2>
              
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                {/* Enhanced search functionality */}
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsSearchActive(e.target.value.trim().length > 0);
                    }}
                    placeholder="Search students..."
                    className="w-full sm:w-64 pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  {isSearchActive && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setIsSearchActive(false);
                      }}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <svg className="h-5 w-5 text-gray-400 hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                
                <button
                  onClick={() => setAddStudentModalOpen(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                >
                  <span className="mr-2">➕</span>
                  Add Student
                </button>
              </div>
            </div>

            {/* Enhanced tab navigation */}
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { key: "all", label: "All", icon: "👥" },
                { key: "active", label: "Active", icon: "✅" },
                { key: "expiring", label: "Expiring", icon: "⚠️" },
                { key: "overdue", label: "Overdue", icon: "🚨" },
                { key: "inactive", label: "Inactive", icon: "⭕" }
              ].map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => setCurrentTab(key)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors flex items-center space-x-1 ${
                    currentTab === key
                      ? "bg-red-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
                  }`}
                >
                  <span>{icon}</span>
                  <span>{label}</span>
                  <span className="ml-1 bg-gray-600 text-xs px-2 py-0.5 rounded-full">
                    {tabCounts[key] || 0}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Lines 705-800: Enhanced student table with Phase 3 components */}
          <div className="overflow-x-auto">
            {filteredStudents.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-600">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Student Information
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Membership
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-600">
                  {filteredStudents.map((student) => (
                    // Phase 3: Using extracted StudentTableRow component
                    <StudentTableRow
                      key={student.id}
                      student={student}
                      onProcessPayment={handleProcessPayment}
                      onViewStudent={handleViewStudent}
                      onEditStudent={handleEditStudent}
                      onSendReminder={handleSendReminder}
                      canSendReminder={canSendReminder}
                      smsLoading={smsLoading}
                      getStudentStatus={getStudentStatus}
                    />
                  ))}
                </tbody>
              </table>
            ) : (
              // Lines 805-830: Enhanced empty state
              <div className="text-center py-12">
                <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-400 mb-2">
                  {isSearchActive ? "No students found" : "No students yet"}
                </h3>
                <p className="text-gray-500 mb-4">
                  {isSearchActive 
                    ? `No students match "${searchQuery}". Try adjusting your search.`
                    : "Get started by adding your first student to the academy."
                  }
                </p>
                {isSearchActive ? (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setIsSearchActive(false);
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Clear Search
                  </button>
                ) : (
                  <button
                    onClick={() => setAddStudentModalOpen(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Add First Student
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Lines 835-860: Enhanced results summary */}
        {filteredStudents.length > 0 && (
          <div className="mt-4 px-6 py-3 bg-gray-700 bg-opacity-50 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-400">
              <div>
                Showing {filteredStudents.length} of {students.length} students
                {isSearchActive && (
                  <span className="ml-2 text-blue-400">
                    (filtered by "{searchQuery}")
                  </span>
                )}
                {currentTab !== "all" && (
                  <span className="ml-2 text-yellow-400">
                    (filtered by {currentTab} status)
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-4 mt-2 sm:mt-0">
                <span>Total Revenue: ${pricingBreakdown.totalMonthly?.toLocaleString() || 0}/month</span>
                <span>Avg: ${filteredStudents.length > 0 ? Math.round((pricingBreakdown.totalMonthly || 0) / filteredStudents.length) : 0}/student</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Lines 865-950: Enhanced modals section with Phase 2 components */}
      {/* Phase 2: SMS Credits Modal */}
      <SMSCreditsModal
        isOpen={creditsModalOpen}
        onClose={() => setCreditsModalOpen(false)}
        creditsData={creditsData}
        loading={modalLoading}
      />

      {/* Phase 2: SMS History Modal */}
      <SMSHistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        historyData={historyData}
        loading={modalLoading}
      />

      {/* Enhanced Payment Modal */}
      {paymentModalOpen && selectedStudent && (
        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false);
            setSelectedStudent(null);
          }}
          student={selectedStudent}
          onPaymentProcessed={() => {
            refetch();
            setPaymentModalOpen(false);
            setSelectedStudent(null);
            showSuccess("Payment processed successfully!");
          }}
        />
      )}

      {/* Enhanced Add Student Modal */}
      {addStudentModalOpen && (
        <AddStudentModal
          isOpen={addStudentModalOpen}
          onClose={() => setAddStudentModalOpen(false)}
          onStudentAdded={handleStudentAdded}
        />
      )}
    </div>
  );
}