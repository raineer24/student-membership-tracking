// Line 1: Complete DashboardPage.jsx - Production ready with SMS integration and all fixes
// Enhanced existing dashboard with SMS functionality using clean architecture
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import PaymentModal from "../components/PaymentModal";
import AddStudentModal from "../components/AddStudentModal";
import LogoutButton from "../components/LogoutButton";
import StudentProfileView from "../components/StudentProfileView";
import StudentEditForm from "./StudentEditForm";
import { useToast } from "../hooks/useToast";

// Line 13: SMS Credits Modal Component
const SMSCreditsModal = ({ isOpen, onClose, creditsData, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">SMS Credits Balance</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading credits...</p>
          </div>
        ) : creditsData ? (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                ₱{creditsData.balance || "1000.00"}
              </div>
              <p className="text-gray-600">Available Balance</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Usage Statistics</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Cost per SMS:</span>
                  <span>₱0.35</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated capacity:</span>
                  <span>{Math.floor((creditsData.balance || 1000) / 0.35)} SMS</span>
                </div>
                <div className="flex justify-between">
                  <span>Provider:</span>
                  <span>PhilSMS</span>
                </div>
              </div>
            </div>
            
            {creditsData.balance < 50 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-yellow-800 text-sm">
                  ⚠️ Low balance warning. Consider topping up soon.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-red-600">
            Failed to load credits data
          </div>
        )}
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Line 75: SMS History Modal Component
const SMSHistoryModal = ({ isOpen, onClose, historyData, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">SMS Reminder History</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading history...</p>
          </div>
        ) : historyData ? (
          <div className="space-y-6">
            {/* Statistics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {historyData.totalSent || 0}
                </div>
                <p className="text-blue-800 text-sm">Total SMS Sent</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">
                  ₱{historyData.totalCost || "0.00"}
                </div>
                <p className="text-green-800 text-sm">Total Cost</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-orange-600">
                  {historyData.thisMonth || 0}
                </div>
                <p className="text-orange-800 text-sm">This Month</p>
              </div>
            </div>
            
            {/* Recent Activity */}
            <div>
              <h4 className="font-medium mb-3">Recent Activity</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Date
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Student
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Phone
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Cost
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(historyData.recent || []).map((reminder, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {new Date(reminder.sentAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {reminder.studentName}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {reminder.phoneNumber}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            reminder.status === "SENT" 
                              ? "bg-green-100 text-green-800" 
                              : "bg-red-100 text-red-800"
                          }`}>
                            {reminder.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          ₱{reminder.cost || "0.35"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-red-600">
            Failed to load history data
          </div>
        )}
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Line 180: Custom hook for SMS reminder functionality
const useSMSReminders = (token) => {
  const [smsLoading, setSmsLoading] = useState(false);
  const [lastReminderTime, setLastReminderTime] = useState({});
  const { showSuccess, showError } = useToast();

  // Line 186: Rate limiting check - 24 hour cooldown per student
  const canSendReminder = React.useCallback(
    (student) => {
      const status = getStudentStatus(student);
      if (!student?.phone || (status !== "OVERDUE" && status !== "EXPIRED")) {
        return false;
      }

      const lastReminder = lastReminderTime[student.id];
      const now = Date.now();
      const cooldownMs = 24 * 60 * 60 * 1000;
      return !lastReminder || now - lastReminder >= cooldownMs;
    },
    [lastReminderTime]
  );

  // Line 199: Send SMS reminder function
  const sendReminder = React.useCallback(
    async (student) => {
      if (!student?.phone) {
        showError("Student has no phone number on file");
        return false;
      }

      if (!canSendReminder(student)) {
        const lastReminder = lastReminderTime[student.id];
        const now = Date.now();
        const hoursLeft = Math.ceil(
          (24 * 60 * 60 * 1000 - (now - lastReminder)) / (60 * 60 * 1000)
        );
        showError(
          `Please wait ${hoursLeft} more hours before sending another reminder to ${student.name || student.firstName}`
        );
        return false;
      }

      setSmsLoading(true);

      try {
        const studentName = student.name || `${student.firstName} ${student.lastName}`;
        const response = await fetch("/api/reminders/send", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            studentId: student.id,
            message: `Hi ${studentName}! Your membership payment is overdue. Please settle your account to continue accessing our services. Thank you!`,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Failed to send reminder");
        }

        setLastReminderTime((prev) => ({
          ...prev,
          [student.id]: Date.now(),
        }));

        showSuccess(
          `✅ SMS sent to ${studentName} (${result.data.phoneNumber}) - Cost: ₱${result.data.cost}`
        );
        return true;
      } catch (error) {
        showError(`Failed to send reminder: ${error.message}`);
        return false;
      } finally {
        setSmsLoading(false);
      }
    },
    [token, lastReminderTime, showSuccess, showError, canSendReminder]
  );

  return {
    smsLoading,
    canSendReminder,
    sendReminder,
    lastReminderTime,
  };
};

// Line 251: Custom hook for SMS modals management
const useSMSModals = (token) => {
  const [creditsModalOpen, setCreditsModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [creditsData, setCreditsData] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const { showError } = useToast();

  // Line 259: Fetch SMS credits data
  const fetchCredits = React.useCallback(async () => {
    setModalLoading(true);
    setCreditsModalOpen(true);

    try {
      const response = await fetch("/api/reminders/credits", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      setCreditsData(result.data);
    } catch (error) {
      showError(`Failed to fetch credits: ${error.message}`);
      setCreditsData(null);
    } finally {
      setModalLoading(false);
    }
  }, [token, showError]);

  // Line 279: Fetch SMS history data
  const fetchHistory = React.useCallback(async () => {
    setModalLoading(true);
    setHistoryModalOpen(true);

    try {
      const response = await fetch("/api/reminders", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      setHistoryData(result.data);
    } catch (error) {
      showError(`Failed to fetch history: ${error.message}`);
      setHistoryData(null);
    } finally {
      setModalLoading(false);
    }
  }, [token, showError]);

  return {
    creditsModalOpen,
    historyModalOpen,
    creditsData,
    historyData,
    modalLoading,
    fetchCredits,
    fetchHistory,
    closeCreditsModal: () => setCreditsModalOpen(false),
    closeHistoryModal: () => setHistoryModalOpen(false),
  };
};

// Line 309: Helper function to determine student status from memberships
const getStudentStatus = (student) => {
  if (!student.memberships || student.memberships.length === 0) {
    return "INACTIVE";
  }
  
  const now = new Date();
  
  // Find the most recent membership by end date
  const latestMembership = student.memberships.reduce((latest, current) => {
    return new Date(current.endDate) > new Date(latest.endDate) ? current : latest;
  });
  
  const endDate = new Date(latestMembership.endDate);
  const daysDifference = (endDate - now) / (1000 * 60 * 60 * 24);
  
  // Active: membership hasn't expired yet
  if (daysDifference > 0) {
    return "ACTIVE";
  }
  
  // Overdue: expired within last 30 days
  const daysSinceExpiry = Math.abs(daysDifference);
  if (daysSinceExpiry <= 30) {
    return "OVERDUE";
  }
  
  // Expired: more than 30 days past expiration
  return "EXPIRED";
};

// Line 334: SMS Header Controls Component
const SMSHeaderControls = ({ onCheckCredits, onViewHistory, loading = false }) => {
  return (
    <>
      <button
        onClick={onCheckCredits}
        disabled={loading}
        className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
        title="Check SMS credits balance"
      >
        💳 Credits
      </button>
      <button
        onClick={onViewHistory}
        disabled={loading}
        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
        title="View SMS reminder history"
      >
        📊 History
      </button>
    </>
  );
};

// Line 355: SMS Action Button Component
const SMSActionButton = ({ student, canSendReminder, onSendReminder, loading = false }) => {
  const status = getStudentStatus(student);
  const isOverdue = status === "OVERDUE" || status === "EXPIRED";
  const showButton = canSendReminder(student);

  if (!isOverdue) return null;

  if (!student.phone) {
    return (
      <span className="text-red-500 text-xs" title="No phone number on file">
        📱 ❌
      </span>
    );
  }

  if (!showButton) {
    return (
      <span
        className="text-gray-500 text-xs"
        title="Reminder sent recently - 24hr cooldown"
      >
        📱 ⏳
      </span>
    );
  }

  return (
    <button
      onClick={() => onSendReminder(student)}
      disabled={loading}
      className="bg-orange-600 text-white px-3 py-1 rounded text-xs hover:bg-orange-700 transition-colors disabled:opacity-50"
      title={`Send payment reminder to ${student.name || student.firstName}`}
    >
      📱 Remind
    </button>
  );
};

// Line 384: Main Dashboard Component
export default function DashboardPage() {
  const { user, token } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState(null);

  // View state management
  const [activeView, setActiveView] = useState("dashboard");
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  const { showSuccess, showError } = useToast();

  // Modal states
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [addStudentModalOpen, setAddStudentModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Student filtering and search state
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");

  // Line 407: Integrate SMS hooks
  const { smsLoading, canSendReminder, sendReminder } = useSMSReminders(token);

  const {
    creditsModalOpen,
    historyModalOpen,
    creditsData,
    historyData,
    modalLoading,
    fetchCredits,
    fetchHistory,
    closeCreditsModal,
    closeHistoryModal,
  } = useSMSModals(token);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Line 424: Enhanced refresh function
  const refreshData = useCallback(() => {
    setError(null);
    fetchDashboardData();
  }, []);

  // Line 429: Fetch dashboard and student data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [dashboardRes, studentsRes] = await Promise.all([
        fetch("/api/dashboard", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
        fetch("/api/students", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
      ]);

      if (!dashboardRes.ok || !studentsRes.ok) {
        throw new Error(`Dashboard: ${dashboardRes.status}, Students: ${studentsRes.status}`);
      }

      const [dashboardData, studentsData] = await Promise.all([
        dashboardRes.json(),
        studentsRes.json(),
      ]);

      // Try multiple extraction patterns for students data
      let extractedStudents = [];
      
      if (Array.isArray(studentsData)) {
        extractedStudents = studentsData;
      } else if (studentsData.data && Array.isArray(studentsData.data)) {
        extractedStudents = studentsData.data;
      } else if (studentsData.students && Array.isArray(studentsData.students)) {
        extractedStudents = studentsData.students;
      }

      setDashboardData(dashboardData);
      setStudents(extractedStudents);

    } catch (error) {
      setError("Failed to load dashboard data. Please try again.");
      showError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  // Line 472: Enhanced handleSendReminder with data refresh
  const handleSendReminder = async (student) => {
    const success = await sendReminder(student);
    if (success) {
      fetchDashboardData();
    }
  };

  // Line 479: Handler functions with proper student data handling
  const handleProcessPayment = (student) => {
    setSelectedStudent(student);
    setPaymentModalOpen(true);
  };

  const handleViewStudent = (studentId) => {
    const studentData = students.find(s => s.id === studentId);
    
    if (studentData) {
      setSelectedStudentId(studentId);
      setActiveView("profile");
    } else {
      showError("Student not found");
    }
  };

  const handleEditStudent = (student) => {
    setStudentToEdit(student);
    setEditMode(true);
    setActiveView("edit");
  };

  // Line 500: Back to dashboard handler
  const handleBackToDashboard = useCallback(() => {
    setActiveView("dashboard");
    setSelectedStudentId(null);
    setEditMode(false);
    setStudentToEdit(null);
  }, []);

  // Line 508: Student save handler with proper API call
  const handleSaveStudent = useCallback(async (updatedStudent) => {
    try {
      const response = await fetch(`/api/students/${updatedStudent.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: updatedStudent.name,
          email: updatedStudent.email,
          phone: updatedStudent.phone,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      // Update local state immediately for better UX
      setStudents(prev => 
        prev.map(s => s.id === updatedStudent.id ? { ...s, ...updatedStudent } : s)
      );

      // Refresh from server to ensure data consistency
      await fetchDashboardData();
      
      // Navigate back to dashboard
      handleBackToDashboard();
      
      showSuccess(`${updatedStudent.name} updated successfully!`);
      
    } catch (error) {
      showError(`Failed to update student: ${error.message}`);
      throw error;
    }
  }, [token, fetchDashboardData, handleBackToDashboard, showSuccess, showError]);

  const handlePaymentSuccess = () => {
    fetchDashboardData();
    setPaymentModalOpen(false);
    setSelectedStudent(null);
    showSuccess("Payment processed successfully!");
  };

  const handleStudentAdded = () => {
    fetchDashboardData();
    setAddStudentModalOpen(false);
    showSuccess("Student added successfully!");
  };

  // Line 549: Enhanced filtering logic with proper status calculation
  const filteredStudents = useMemo(() => {
    if (!Array.isArray(students) || students.length === 0) {
      return [];
    }
    
    let filtered = [...students];

    // Tab filtering with fixed status logic
    if (activeTab === "active") {
      filtered = filtered.filter(student => getStudentStatus(student) === "ACTIVE");
    } else if (activeTab === "inactive") {
      filtered = filtered.filter(student => getStudentStatus(student) === "INACTIVE");
    } else if (activeTab === "overdue") {
      filtered = filtered.filter(student => {
        const status = getStudentStatus(student);
        return status === "OVERDUE" || status === "EXPIRED";
      });
    }

    // Membership type filtering
    if (selectedFilter !== "all") {
      filtered = filtered.filter((student) => {
        if (!student.memberships || student.memberships.length === 0) {
          return selectedFilter === "expired";
        }

        if (selectedFilter === "monthly") {
          return student.memberships.some(m => 
            (m.membershipType && m.membershipType.toLowerCase().includes("monthly")) ||
            (m.type && m.type === "MONTHLY")
          );
        } else if (selectedFilter === "yearly") {
          return student.memberships.some(m => 
            (m.membershipType && m.membershipType.toLowerCase().includes("yearly")) ||
            (m.type && m.type === "YEARLY")
          );
        } else if (selectedFilter === "expired") {
          const status = getStudentStatus(student);
          return status === "EXPIRED" || status === "OVERDUE";
        }
        return true;
      });
    }

    // Search filtering
    if (searchTerm) {
      filtered = filtered.filter((student) => {
        const name = (student.name || "").toLowerCase();
        const firstName = (student.firstName || "").toLowerCase();
        const lastName = (student.lastName || "").toLowerCase();
        const email = (student.email || "").toLowerCase();
        const phone = (student.phone || "").toLowerCase();
        const searchLower = searchTerm.toLowerCase();

        return name.includes(searchLower) ||
               firstName.includes(searchLower) ||
               lastName.includes(searchLower) ||
               email.includes(searchLower) ||
               phone.includes(searchLower);
      });
    }
    
    return filtered;
  }, [students, activeTab, searchTerm, selectedFilter]);

  // Line 602: Loading and error states
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner message="Loading dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <ErrorMessage message={error} onRetry={refreshData} />
      </div>
    );
  }

  // Line 618: Conditional view rendering for profile and edit
  if (activeView === "profile" && selectedStudentId) {
    const selectedStudentData = students.find(s => s.id === selectedStudentId);
    
    if (!selectedStudentData) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Student Not Found</h2>
            <p className="text-gray-600 mb-4">The requested student could not be found.</p>
            <button
              onClick={handleBackToDashboard}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
        onEdit={handleEditStudent}
      />
    );
  }

  if (activeView === "edit" && studentToEdit) {
    return (
      <StudentEditForm
        student={studentToEdit}
        onBack={handleBackToDashboard}
        onSave={handleSaveStudent}
      />
    );
  }

  // Line 650: Main dashboard render
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with SMS controls */}
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
              <SMSHeaderControls
                onCheckCredits={fetchCredits}
                onViewHistory={fetchHistory}
                loading={modalLoading}
              />
              <button
                onClick={refreshData}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                title="Refresh dashboard data"
              >
                Refresh Data
              </button>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <SummaryCards data={dashboardData.summary} />

        {/* Student Management Section */}
        <div className="mt-8 bg-white rounded-lg shadow">
          {/* Tabs */}
          <StudentTabs
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            students={students}
          />

          {/* Search and Filters */}
          <SearchAndFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedFilter={selectedFilter}
            setSelectedFilter={setSelectedFilter}
            students={students}
          />

          {/* Students Table with SMS functionality */}
          <StudentsTable
            students={filteredStudents}
            loading={loading}
            onProcessPayment={handleProcessPayment}
            onViewStudent={handleViewStudent}
            onEditStudent={handleEditStudent}
            onSendReminder={handleSendReminder}
            canSendReminder={canSendReminder}
            smsLoading={smsLoading}
          />

          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex gap-3">
              <button
                onClick={() => setAddStudentModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                👤 Add Student
              </button>
              <button
                onClick={() => setPaymentModalOpen(true)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                💳 Process Payment
              </button>
            </div>
          </div>
        </div>

        {/* Data Timestamp */}
        <div className="mt-6 text-center text-sm text-gray-500">
          Last updated: {new Date(dashboardData.timestamp).toLocaleString()}
        </div>
      </main>

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

      {/* SMS Modals */}
      <SMSCreditsModal
        isOpen={creditsModalOpen}
        onClose={closeCreditsModal}
        creditsData={creditsData}
        loading={modalLoading}
      />

      <SMSHistoryModal
        isOpen={historyModalOpen}
        onClose={closeHistoryModal}
        historyData={historyData}
        loading={modalLoading}
      />
    </div>
  );
}

// Line 755: Enhanced StudentsTable component with SMS reminder functionality
const StudentsTable = ({
  students,
  loading,
  onProcessPayment,
  onViewStudent,
  onEditStudent,
  onSendReminder,
  canSendReminder,
  smsLoading,
}) => {
  if (loading) {
    return (
      <div className="px-6 py-8">
        <LoadingSpinner message="Loading students..." />
      </div>
    );
  }

  if (!students || !Array.isArray(students)) {
    return (
      <div className="px-6 py-8 text-center text-red-500">
        Error: Students data is not in the correct format
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="px-6 py-8 text-center text-gray-500">
        No students found matching your criteria.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Student
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Membership
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Due Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {students.map((student, index) => (
            <StudentRow
              key={student.id || index}
              student={student}
              onProcessPayment={onProcessPayment}
              onViewStudent={onViewStudent}
              onEditStudent={onEditStudent}
              onSendReminder={onSendReminder}
              canSendReminder={canSendReminder}
              smsLoading={smsLoading}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Line 818: Enhanced StudentRow component with SMS reminder button
const StudentRow = ({
  student,
  onProcessPayment,
  onViewStudent,
  onEditStudent,
  onSendReminder,
  canSendReminder,
  smsLoading,
}) => {
  // Helper function to get latest membership
  const getLatestMembership = (memberships) => {
    if (!memberships || memberships.length === 0) return null;
    return memberships.reduce((latest, current) => {
      return new Date(current.endDate) > new Date(latest.endDate) ? current : latest;
    });
  };

  // Helper function for status badge styling
  const getStatusBadge = (status) => {
    const badges = {
      ACTIVE: "bg-green-100 text-green-800",
      INACTIVE: "bg-gray-100 text-gray-800",
      OVERDUE: "bg-red-100 text-red-800",
      EXPIRED: "bg-red-100 text-red-800",
    };
    return badges[status] || "bg-gray-100 text-gray-800";
  };

  // Helper function to format dates safely
  const formatDueDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `${Math.abs(diffDays)} days overdue`;
    } else if (diffDays === 0) {
      return "Due today";
    } else {
      return `${diffDays} days remaining`;
    }
  };

  // Calculate derived fields
  const status = getStudentStatus(student);
  const latestMembership = getLatestMembership(student.memberships);
  const studentName = student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || "Unknown";
  
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {studentName}
            </div>
            <div className="text-sm text-gray-500">{student.email}</div>
            {student.phone && (
              <div className="text-sm text-gray-500">{student.phone}</div>
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(status)}`}
        >
          {status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">
          {latestMembership?.type || latestMembership?.membershipType || "No Membership"}
          {latestMembership?.fee && ` - ${latestMembership.fee}`}
        </div>
        <div className="text-sm text-gray-500">
          Started: {latestMembership?.startDate 
            ? new Date(latestMembership.startDate).toLocaleDateString()
            : "N/A"}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {formatDueDate(latestMembership?.endDate)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
        {/* SMS Reminder Button */}
        <SMSActionButton
          student={student}
          canSendReminder={canSendReminder}
          onSendReminder={onSendReminder}
          loading={smsLoading}
        />

        {/* Existing action buttons */}
        <button
          onClick={() => onProcessPayment(student)}
          className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
          title="Process payment"
        >
          💳 Pay
        </button>
        <button
          onClick={() => onViewStudent(student.id)}
          className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
          title="View student details"
        >
          👁️ View
        </button>
        <button
          onClick={() => onEditStudent(student)}
          className="bg-gray-600 text-white px-3 py-1 rounded text-xs hover:bg-gray-700"
          title="Edit student information"
        >
          ✏️ Edit
        </button>
      </td>
    </tr>
  );
};

// Line 926: SummaryCards component
const SummaryCards = ({ data }) => {
  const cards = [
    {
      title: "Total Students",
      value: data.totalStudents || 0,
      subtitle: `View all registered students`,
      icon: "👥",
      color: "blue",
    },
    {
      title: "Active",
      value: data.activeStudents || 0,
      subtitle: "Currently enrolled",
      icon: "✅",
      color: "green",
    },
    {
      title: "Inactive",
      value: data.inactiveStudents || 0,
      subtitle: "Not currently enrolled",
      icon: "⏸️",
      color: "gray",
    },
    {
      title: "Overdue",
      value: data.pendingPayments || 0,
      subtitle: "Payment required",
      icon: "⚠️",
      color: "red",
    },
    {
      title: "Total Revenue",
      value: `${data.totalRevenue || 0}`,
      subtitle: `${data.thisMonthRevenue || 0} this month`,
      icon: "💰",
      color: "yellow",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
      {cards.map((card, index) => (
        <StatsCard key={index} {...card} />
      ))}
    </div>
  );
};

// Line 969: StatsCard component
const StatsCard = ({ title, value, subtitle, icon, color }) => {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 text-blue-900",
    green: "bg-green-50 border-green-200 text-green-900",
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-900",
    red: "bg-red-50 border-red-200 text-red-900",
    gray: "bg-gray-50 border-gray-200 text-gray-900",
  };

  return (
    <div className={`${colorClasses[color]} border rounded-lg p-4`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium opacity-75">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs opacity-60 mt-1">{subtitle}</p>
        </div>
        <div className="text-2xl ml-4">{icon}</div>
      </div>
    </div>
  );
};

// Line 993: StudentTabs component with proper status counting
const StudentTabs = ({ activeTab, setActiveTab, students }) => {
  const tabs = useMemo(() => {
    const activeCount = students.filter(s => getStudentStatus(s) === "ACTIVE").length;
    const inactiveCount = students.filter(s => getStudentStatus(s) === "INACTIVE").length;
    const overdueCount = students.filter(s => {
      const status = getStudentStatus(s);
      return status === "OVERDUE" || status === "EXPIRED";
    }).length;

    return [
      { id: "all", label: "All Students", count: students.length },
      { id: "active", label: "Active", count: activeCount },
      { id: "inactive", label: "Inactive", count: inactiveCount },
      { id: "overdue", label: "Overdue", count: overdueCount },
    ];
  }, [students]);

  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8 px-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`${
              activeTab === tab.id
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </nav>
    </div>
  );
};

// Line 1026: SearchAndFilters component with proper counts
const SearchAndFilters = ({
  searchTerm,
  setSearchTerm,
  selectedFilter,
  setSelectedFilter,
  students,
}) => {
  const filterCounts = useMemo(() => {
    const monthlyCount = students.filter((student) =>
      student.memberships?.some((m) => 
        (m.type && m.type.toLowerCase() === "monthly") ||
        (m.membershipType && m.membershipType.toLowerCase().includes("monthly"))
      )
    ).length;

    const yearlyCount = students.filter((student) =>
      student.memberships?.some((m) => 
        (m.type && m.type.toLowerCase() === "yearly") ||
        (m.membershipType && m.membershipType.toLowerCase().includes("yearly"))
      )
    ).length;

    const expiredCount = students.filter((student) => {
      const status = getStudentStatus(student);
      return status === "EXPIRED" || status === "OVERDUE";
    }).length;

    return { monthlyCount, yearlyCount, expiredCount };
  }, [students]);

  return (
    <div className="px-6 py-4 border-b border-gray-200">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search students by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="w-full sm:w-64">
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Memberships ({students.length})</option>
            <option value="monthly">
              Monthly ({filterCounts.monthlyCount})
            </option>
            <option value="yearly">Yearly ({filterCounts.yearlyCount})</option>
            <option value="expired">
              Expired ({filterCounts.expiredCount})
            </option>
          </select>
        </div>
      </div>
    </div>
  );
};