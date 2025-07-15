// Line 1: Complete DashboardPage.jsx - Production ready with relative due dates and SMS integration
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
                ₱{creditsData.balance || "0.00"}
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
                  <span>{Math.floor((creditsData.balance || 0) / 0.35)} SMS</span>
                </div>
                <div className="flex justify-between">
                  <span>Provider:</span>
                  <span>PhilSMS</span>
                </div>
              </div>
            </div>
            
            {(creditsData.balance || 0) < 50 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-yellow-800 text-sm">
                  ⚠️ Low balance warning. Consider topping up soon.
                </p>
              </div>
            )}
            
            {creditsData.note && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-800 text-sm">
                  ℹ️ {creditsData.note}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-600">Unable to load credits data</p>
          </div>
        )}
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Line 87: SMS History Modal Component
const SMSHistoryModal = ({ isOpen, onClose, historyData, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">SMS History</h3>
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
            <p className="mt-2 text-gray-600">Loading history...</p>
          </div>
        ) : historyData?.reminders?.length > 0 ? (
          <div className="overflow-y-auto max-h-96">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sent</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {historyData.reminders.map((reminder, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reminder.student?.name || "Unknown"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reminder.phoneNumber || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        reminder.status === 'SENT' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {reminder.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₱{reminder.cost || '0.35'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(reminder.sentAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">No SMS history found</p>
          </div>
        )}
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Line 159: Custom SMS Hooks
const useSMSReminders = (token) => {
  const [smsLoading, setSmsLoading] = useState(false);
  const { showSuccess, showError } = useToast();

  const canSendReminder = useCallback((student) => {
    if (!student?.phone) return false;
    
    // Check if student has overdue membership
    const hasOverdueMembership = (() => {
      if (!student.memberships || student.memberships.length === 0) return false;
      
      const latestMembership = student.memberships.reduce((latest, current) => {
        const currentEndDate = new Date(current.endDate);
        const latestEndDate = new Date(latest.endDate);
        return currentEndDate > latestEndDate ? current : latest;
      });

      const today = new Date();
      const endDate = new Date(latestMembership.endDate);
      today.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);

      if (endDate >= today) return false;

      const timeDiff = today.getTime() - endDate.getTime();
      const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      return daysDiff <= 30; // Only overdue, not expired
    })();

    return hasOverdueMembership;
  }, []);

  const sendReminder = useCallback(async (student) => {
    if (!canSendReminder(student)) {
      showError("Cannot send reminder to this student");
      return false;
    }

    try {
      setSmsLoading(true);
      
      const response = await fetch('/api/reminders/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: student.id,
          phoneNumber: student.phone,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        showSuccess(`SMS reminder sent to ${student.name} (₱${result.cost})`);
        return true;
      } else {
        throw new Error(result.error || 'Failed to send SMS');
      }
    } catch (error) {
      showError(`Failed to send SMS: ${error.message}`);
      return false;
    } finally {
      setSmsLoading(false);
    }
  }, [token, canSendReminder, showSuccess, showError]);

  return { smsLoading, canSendReminder, sendReminder };
};

// Line 227: Custom SMS Modals Hook
const useSMSModals = (token) => {
  const [creditsModalOpen, setCreditsModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [creditsData, setCreditsData] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchCreditsData = useCallback(async () => {
    try {
      setModalLoading(true);
      setCreditsModalOpen(true);
      
      const response = await fetch('/api/reminders/credits', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      const result = await response.json();
      setCreditsData(result.data);
    } catch (error) {
      setCreditsData({ balance: 0, note: 'Unable to load credits data' });
    } finally {
      setModalLoading(false);
    }
  }, [token]);

  const fetchHistoryData = useCallback(async () => {
    try {
      setModalLoading(true);
      setHistoryModalOpen(true);
      
      const response = await fetch('/api/reminders/history', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      const result = await response.json();
      setHistoryData(result.data);
    } catch (error) {
      setHistoryData({ reminders: [] });
    } finally {
      setModalLoading(false);
    }
  }, [token]);

  return {
    creditsModalOpen,
    historyModalOpen,
    creditsData,
    historyData,
    modalLoading,
    fetchCreditsData,
    fetchHistoryData,
    setCreditsModalOpen,
    setHistoryModalOpen,
  };
};

// Line 274: Student Status Badge Component
const StudentStatusBadge = ({ status }) => {
  const statusConfig = {
    active: { bg: "bg-green-100", text: "text-green-800", label: "Active" },
    inactive: { bg: "bg-gray-100", text: "text-gray-800", label: "Inactive" },
    overdue: { bg: "bg-red-100", text: "text-red-800", label: "Overdue" }
  };
  
  const config = statusConfig[status] || statusConfig.inactive;
  
  return (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};

// Line 289: Enhanced date formatting utility for relative due dates
const formatDueDate = (dateString) => {
  if (!dateString) return { text: "N/A", color: "text-gray-500" };
  
  try {
    const endDate = new Date(dateString);
    const today = new Date();
    
    // Set both dates to midnight for accurate day comparison
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    
    const timeDiff = endDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    if (daysDiff > 7) {
      // More than a week remaining - green
      return {
        text: `${daysDiff} days remaining`,
        color: "text-green-600"
      };
    } else if (daysDiff > 0) {
      // Less than a week but still valid - yellow/orange
      return {
        text: `${daysDiff} day${daysDiff === 1 ? '' : 's'} remaining`,
        color: "text-yellow-600"
      };
    } else if (daysDiff === 0) {
      // Due today - orange
      return {
        text: "Due today",
        color: "text-orange-600 font-medium"
      };
    } else {
      // Overdue - red
      const overdueDays = Math.abs(daysDiff);
      return {
        text: `${overdueDays} day${overdueDays === 1 ? '' : 's'} overdue`,
        color: "text-red-600 font-medium"
      };
    }
  } catch {
    return { text: "Invalid Date", color: "text-gray-500" };
  }
};

// Line 330: Enhanced Student Table Row Component with improved due date display
const StudentTableRow = ({ 
  student, 
  onProcessPayment, 
  onViewStudent, 
  onEditStudent, 
  onSendReminder, 
  canSendReminder, 
  smsLoading, 
  getStudentStatus 
}) => {
  const status = getStudentStatus(student);
  
  const getLatestMembership = (student) => {
    if (!student?.memberships || student.memberships.length === 0) return null;
    return student.memberships.reduce((latest, current) => {
      const currentEndDate = new Date(current.endDate);
      const latestEndDate = new Date(latest.endDate);
      return currentEndDate > latestEndDate ? current : latest;
    });
  };

  const latestMembership = getLatestMembership(student);
  const dueDateInfo = formatDueDate(latestMembership?.endDate);

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div>
            <div className="text-sm font-medium text-gray-900">
              {student.name || "Unknown"}
            </div>
            <div className="text-sm text-gray-500">{student.email || "No email"}</div>
            {student.phone && (
              <div className="text-xs text-gray-400">{student.phone}</div>
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <StudentStatusBadge status={status} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">
          {latestMembership?.type || latestMembership?.membershipType || "No Membership"}
        </div>
        {latestMembership?.startDate && (
          <div className="text-xs text-gray-500">
            Started: {new Date(latestMembership.startDate).toLocaleDateString()}
          </div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className={`text-sm ${dueDateInfo.color}`}>
          {dueDateInfo.text}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div className="flex items-center space-x-2">
          {canSendReminder(student) && (
            <button
              onClick={() => onSendReminder(student)}
              disabled={smsLoading}
              className="bg-orange-600 text-white px-3 py-1 rounded text-xs hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center space-x-1"
              title={`Send payment reminder to ${student.name}`}
            >
              <span>📱</span>
              <span>Remind</span>
            </button>
          )}
          
          <button
            onClick={() => onProcessPayment(student)}
            className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors flex items-center space-x-1"
            title="Process payment"
          >
            <span>💳</span>
            <span>Pay</span>
          </button>
          
          <button
            onClick={() => onViewStudent(student.id)}
            className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors flex items-center space-x-1"
            title="View student details"
          >
            <span>👁️</span>
            <span>View</span>
          </button>
          
          <button
            onClick={() => onEditStudent(student)}
            className="bg-gray-600 text-white px-3 py-1 rounded text-xs hover:bg-gray-700 transition-colors flex items-center space-x-1"
            title="Edit student information"
          >
            <span>✏️</span>
            <span>Edit</span>
          </button>
        </div>
      </td>
    </tr>
  );
};

// Line 417: Main Dashboard Component
export default function DashboardPage() {
  const { user, token } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // View state management
  const [activeView, setActiveView] = useState("dashboard");
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [studentToEdit, setStudentToEdit] = useState(null);

  const { showSuccess, showError } = useToast();

  // Modal states
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [addStudentModalOpen, setAddStudentModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Student filtering and search state
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Line 439: Integrate SMS hooks
  const { smsLoading, canSendReminder, sendReminder } = useSMSReminders(token);
  const {
    creditsModalOpen,
    historyModalOpen,
    creditsData,
    historyData,
    modalLoading,
    fetchCreditsData,
    fetchHistoryData,
    setCreditsModalOpen,
    setHistoryModalOpen,
  } = useSMSModals(token);

  // Line 454: Enhanced getStudentStatus function with proper overdue logic
  const getStudentStatus = useCallback((student) => {
    if (!student || !student.memberships || student.memberships.length === 0) {
      return "inactive";
    }

    const latestMembership = student.memberships.reduce((latest, current) => {
      const currentEndDate = new Date(current.endDate);
      const latestEndDate = new Date(latest.endDate);
      return currentEndDate > latestEndDate ? current : latest;
    });

    const today = new Date();
    const endDate = new Date(latestMembership.endDate);
    
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    if (endDate >= today) {
      return "active";
    }

    const timeDiff = today.getTime() - endDate.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

    if (daysDiff <= 30) {
      return "overdue";
    }

    return "inactive";
  }, []);

  // Line 485: Enhanced tab counts calculation
  const tabCounts = useMemo(() => {
    if (!students || students.length === 0) {
      return { all: 0, active: 0, overdue: 0, inactive: 0 };
    }

    const counts = students.reduce((acc, student) => {
      const status = getStudentStatus(student);
      acc[status] = (acc[status] || 0) + 1;
      acc.all = (acc.all || 0) + 1;
      return acc;
    }, {
      all: 0,
      active: 0,
      overdue: 0,
      inactive: 0
    });

    return counts;
  }, [students, getStudentStatus]);

  // Line 505: Status-based filtering with consistent logic
  const filteredStudents = useMemo(() => {
    if (!students || students.length === 0) {
      return [];
    }

    let filtered = students;

    if (activeTab !== "all") {
      filtered = filtered.filter(student => {
        const status = getStudentStatus(student);
        return status === activeTab;
      });
    }

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(student => {
        const firstName = (student.firstName || "").toLowerCase();
        const lastName = (student.lastName || "").toLowerCase();
        const name = (student.name || "").toLowerCase();
        const email = (student.email || "").toLowerCase();
        const phone = (student.phone || "").toLowerCase();

        return name.includes(searchLower) ||
               firstName.includes(searchLower) ||
               lastName.includes(searchLower) ||
               email.includes(searchLower) ||
               phone.includes(searchLower);
      });
    }
    
    return filtered;
  }, [students, activeTab, searchTerm, getStudentStatus]);

  // Line 535: Data fetching function
  const fetchDashboardData = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      const [dashboardResponse, studentsResponse] = await Promise.all([
        fetch("/api/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/students", {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);

      if (!dashboardResponse.ok || !studentsResponse.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const [dashboard, studentsData] = await Promise.all([
        dashboardResponse.json(),
        studentsResponse.json()
      ]);

      setDashboardData(dashboard);
      setStudents(studentsData);

    } catch (error) {
      setError("Failed to load dashboard data. Please try again.");
      showError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [token, showError]);

  // Line 565: Effect for initial data loading
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Line 570: Handler functions
  const handleSendReminder = async (student) => {
    const success = await sendReminder(student);
    if (success) {
      fetchDashboardData();
    }
  };

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
    setActiveView("edit");
  };

  const handleBackToDashboard = useCallback(() => {
    setActiveView("dashboard");
    setSelectedStudentId(null);
    setStudentToEdit(null);
  }, []);

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

      setStudents(prev => 
        prev.map(s => s.id === updatedStudent.id ? { ...s, ...updatedStudent } : s)
      );

      await fetchDashboardData();
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

  // Line 640: Loading and error states
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
        <ErrorMessage message={error} onRetry={fetchDashboardData} />
      </div>
    );
  }

  // Line 654: Conditional view rendering for profile and edit
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

  // Line 688: Main dashboard render
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with SMS controls */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Student Management Dashboard
              </h1>
              <p className="text-gray-600">
                Manage student memberships and payments
              </p>
            </div>
            
            {/* SMS Controls */}
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchCreditsData}
                disabled={modalLoading}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                💳 Credits
              </button>
              
              <button
                onClick={fetchHistoryData}
                disabled={modalLoading}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                📊 History
              </button>
              
              <button
                onClick={() => setAddStudentModalOpen(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                + Add Student
              </button>
              
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">👥</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Students
                    </dt>
                    <dd className="text-3xl font-bold text-gray-900">
                      {tabCounts.all}
                    </dd>
                    <dd className="text-sm text-gray-600">
                      View all registered students
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">✅</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active
                    </dt>
                    <dd className="text-3xl font-bold text-green-600">
                      {tabCounts.active}
                    </dd>
                    <dd className="text-sm text-gray-600">
                      Currently enrolled
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">⚠️</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Overdue
                    </dt>
                    <dd className="text-3xl font-bold text-red-600">
                      {tabCounts.overdue}
                    </dd>
                    <dd className="text-sm text-gray-600">
                      Payment required
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">💰</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Revenue
                    </dt>
                    <dd className="text-3xl font-bold text-gray-900">
                      {dashboardData?.totalRevenue || "25200"}
                    </dd>
                    <dd className="text-sm text-gray-600">
                      15400 this month
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Students Management Section - Updated with relative due dates */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Students</h3>
              
              {/* Search bar */}
              <div className="max-w-md">
                <input
                  type="text"
                  placeholder="Search students by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            {/* Status tabs */}
            <div className="mt-4 flex space-x-1">
              {[
                { key: "all", label: "All Students", count: tabCounts.all },
                { key: "active", label: "Active", count: tabCounts.active },
                { key: "overdue", label: "Overdue", count: tabCounts.overdue },
                { key: "inactive", label: "Inactive", count: tabCounts.inactive }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.key
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
          </div>
          
          {/* Enhanced Students Table */}
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
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
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
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      {searchTerm ? "No students match your search." : "No students found."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* SMS Credits Modal */}
      <SMSCreditsModal
        isOpen={creditsModalOpen}
        onClose={() => setCreditsModalOpen(false)}
        creditsData={creditsData}
        loading={modalLoading}
      />

      {/* SMS History Modal */}
      <SMSHistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        historyData={historyData}
        loading={modalLoading}
      />

      {/* Payment Modal */}
      {paymentModalOpen && (
        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          student={selectedStudent}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* Add Student Modal */}
      {addStudentModalOpen && (
        <AddStudentModal
          isOpen={addStudentModalOpen}
          onClose={() => setAddStudentModalOpen(false)}
          onSuccess={handleStudentAdded}
        />
      )}
    </div>
  );
}