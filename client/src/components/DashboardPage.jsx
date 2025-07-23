// Line 1: Complete DashboardPage.jsx - BJJ themed with SMS integration and FIXED navigation
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import PaymentModal from "../components/PaymentModal";
import AddStudentModal from "../components/AddStudentModal";
import StudentProfileView from "../components/StudentProfileView";
import StudentEditForm from "./StudentEditForm";
import { useToast } from "../hooks/useToast";

// Line 13: SMS Credits Modal Component with BJJ theme
const SMSCreditsModal = ({ isOpen, onClose, creditsData, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 bg-opacity-95 backdrop-blur-sm rounded-xl border border-gray-600 p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">SMS Credits Balance</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            ✕
          </button>
        </div>
        
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
            <p className="mt-2 text-gray-300">Loading credits...</p>
          </div>
        ) : creditsData ? (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-500">
                ₱{creditsData.balance || "0.00"}
              </div>
              <p className="text-gray-300">Available Balance</p>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="font-medium mb-2 text-white">Usage Statistics</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-gray-300">
                  <span>Cost per SMS:</span>
                  <span>₱0.35</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Estimated capacity:</span>
                  <span>{Math.floor((creditsData.balance || 0) / 0.35)} SMS</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Provider:</span>
                  <span>PhilSMS</span>
                </div>
              </div>
            </div>
            
            {(creditsData.balance || 0) < 50 && (
              <div className="bg-yellow-500 bg-opacity-20 border border-yellow-500 rounded-lg p-3">
                <p className="text-yellow-300 text-sm">
                  ⚠️ Low balance warning. Consider topping up soon.
                </p>
              </div>
            )}
            
            {creditsData.note && (
              <div className="bg-red-500 bg-opacity-20 border border-red-500 rounded-lg p-3">
                <p className="text-red-300 text-sm">
                  ℹ️ {creditsData.note}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-400">Unable to load credits data</p>
          </div>
        )}
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Line 87: SMS History Modal Component with BJJ theme
const SMSHistoryModal = ({ isOpen, onClose, historyData, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 bg-opacity-95 backdrop-blur-sm rounded-xl border border-gray-600 p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">SMS History</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            ✕
          </button>
        </div>
        
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
            <p className="mt-2 text-gray-300">Loading history...</p>
          </div>
        ) : historyData?.reminders?.length > 0 ? (
          <div className="overflow-y-auto max-h-96">
            <table className="min-w-full divide-y divide-gray-600">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Sent</th>
                </tr>
              </thead>
              <tbody className="bg-gray-700 divide-y divide-gray-600">
                {historyData.reminders.map((reminder, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {reminder.student?.name || "Unknown"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {reminder.phoneNumber || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        reminder.status === 'SENT' 
                          ? 'bg-green-500 bg-opacity-20 text-green-400 border border-green-500' 
                          : 'bg-red-500 bg-opacity-20 text-red-400 border border-red-500'
                      }`}>
                        {reminder.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      ₱{reminder.cost || '0.35'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(reminder.sentAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400">No SMS history found</p>
          </div>
        )}
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Line 159: Enhanced Logout Button with BJJ theme
const LogoutButton = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      logout();
      navigate('/');
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors font-medium"
    >
      Logout
    </button>
  );
};

// Line 178: Enhanced Student Status Badge with BJJ theme
const StudentStatusBadge = ({ status }) => {
  const statusConfig = {
    active: { 
      bg: "bg-green-500 bg-opacity-20", 
      text: "text-green-400", 
      border: "border-green-500",
      label: "Active" 
    },
    inactive: { 
      bg: "bg-gray-500 bg-opacity-20", 
      text: "text-gray-400", 
      border: "border-gray-500",
      label: "Inactive" 
    },
    overdue: { 
      bg: "bg-red-500 bg-opacity-20", 
      text: "text-red-400", 
      border: "border-red-500",
      label: "Overdue" 
    }
  };
  
  const config = statusConfig[status] || statusConfig.inactive;
  
  return (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${config.bg} ${config.text} ${config.border}`}>
      {config.label}
    </span>
  );
};

// Line 207: Enhanced date formatting utility
const formatDueDate = (dateString) => {
  if (!dateString) return { text: "N/A", color: "text-gray-400" };
  
  try {
    const endDate = new Date(dateString);
    const today = new Date();
    
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    
    const timeDiff = endDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    if (daysDiff > 7) {
      return {
        text: `${daysDiff} days remaining`,
        color: "text-green-400"
      };
    } else if (daysDiff > 0) {
      return {
        text: `${daysDiff} day${daysDiff === 1 ? '' : 's'} remaining`,
        color: "text-yellow-400"
      };
    } else if (daysDiff === 0) {
      return {
        text: "Due today",
        color: "text-orange-400 font-medium"
      };
    } else {
      const overdueDays = Math.abs(daysDiff);
      return {
        text: `${overdueDays} day${overdueDays === 1 ? '' : 's'} overdue`,
        color: "text-red-400 font-medium"
      };
    }
  } catch {
    return { text: "Invalid Date", color: "text-gray-400" };
  }
};

// Line 245: Enhanced Student Table Row with BJJ theme
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
    <tr className="hover:bg-gray-700 hover:bg-opacity-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div>
            <div className="text-sm font-medium text-white">
              {student.name || "Unknown"}
            </div>
            <div className="text-sm text-gray-400">{student.email || "No email"}</div>
            {student.phone && (
              <div className="text-xs text-gray-500">{student.phone}</div>
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <StudentStatusBadge status={status} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-white">
          {latestMembership?.type || latestMembership?.membershipType || "No Membership"}
        </div>
        {latestMembership?.startDate && (
          <div className="text-xs text-gray-400">
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
            className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 transition-colors flex items-center space-x-1"
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

// Line 337: Main Dashboard Component with BJJ theme
export default function DashboardPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
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

  // SMS state
  const [creditsModalOpen, setCreditsModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [creditsData, setCreditsData] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [smsLoading, setSmsLoading] = useState(false);

  // Line 367: Navigation handler for landing page
  const handleGoToLanding = () => {
    navigate('/');
  };

  // Line 371: SMS functionality hooks
  const canSendReminder = useCallback((student) => {
    if (!student?.phone) return false;
    
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
      return daysDiff <= 30;
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

  // Line 459: Student status and filtering logic
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

  // Line 536: Data fetching and handlers
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

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Line 568: Event handlers
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

  // Line 636: Loading and error states
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

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
            onClick={fetchDashboardData}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Line 668: Conditional view rendering for profile and edit
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

  // Line 702: Main dashboard render with BJJ theme - FIXED: Single navigation only
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header with SINGLE navigation only */}
      <header className="bg-gray-800 bg-opacity-90 backdrop-blur-sm shadow-xl border-b border-gray-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            {/* Left side - Brand and title */}
            <div className="flex items-center space-x-4">
              <button
                onClick={handleGoToLanding}
                className="text-2xl font-bold text-white hover:text-red-500 transition-colors cursor-pointer"
              >
                🥋 BJJ Academy
              </button>
              <div className="border-l border-gray-600 pl-4">
                <h1 className="text-2xl font-bold text-white">
                  Admin Dashboard
                </h1>
                <p className="text-gray-400">
                  Manage student memberships and payments
                </p>
              </div>
            </div>
            
            {/* Right side - SMS controls and logout ONLY */}
            <div className="flex items-center space-x-4">
              {/* SMS Controls */}
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
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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
        {/* Statistics Cards with BJJ theme */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 bg-opacity-90 backdrop-blur-sm overflow-hidden shadow-xl rounded-xl border border-gray-600">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-3xl">👥</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">
                      Total Students
                    </dt>
                    <dd className="text-3xl font-bold text-white">
                      {tabCounts.all}
                    </dd>
                    <dd className="text-sm text-gray-500">
                      All registered students
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 bg-opacity-90 backdrop-blur-sm overflow-hidden shadow-xl rounded-xl border border-gray-600">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-3xl">✅</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">
                      Active
                    </dt>
                    <dd className="text-3xl font-bold text-green-400">
                      {tabCounts.active}
                    </dd>
                    <dd className="text-sm text-gray-500">
                      Currently enrolled
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 bg-opacity-90 backdrop-blur-sm overflow-hidden shadow-xl rounded-xl border border-gray-600">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-3xl">⚠️</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">
                      Overdue
                    </dt>
                    <dd className="text-3xl font-bold text-red-400">
                      {tabCounts.overdue}
                    </dd>
                    <dd className="text-sm text-gray-500">
                      Payment required
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 bg-opacity-90 backdrop-blur-sm overflow-hidden shadow-xl rounded-xl border border-gray-600">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-3xl">💰</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">
                      Total Revenue
                    </dt>
                    <dd className="text-3xl font-bold text-white">
                      ₱{dashboardData?.totalRevenue || "25,200"}
                    </dd>
                    <dd className="text-sm text-gray-500">
                      ₱15,400 this month
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Students Management Section with BJJ theme */}
        <div className="bg-gray-800 bg-opacity-90 backdrop-blur-sm shadow-xl overflow-hidden rounded-xl border border-gray-600">
          <div className="px-6 py-4 border-b border-gray-600">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-white">Students</h3>
              
              {/* Search bar with BJJ theme */}
              <div className="max-w-md">
                <input
                  type="text"
                  placeholder="Search students by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                />
              </div>
            </div>
            
            {/* Status tabs with BJJ theme */}
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
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.key
                      ? 'bg-red-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
          </div>
          
          {/* Enhanced Students Table with BJJ theme */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-600">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Student
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-600">
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
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-400">
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