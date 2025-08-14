// client/src/components/DashboardPage.jsx
// Lines 1-25: Imports and dependencies (Updated with new components)
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { adminApi } from '../services/adminApi';
import { isOverdue, formatDueDate } from '../utils/dateUtils';
import { getStudentPricingDisplay, getPricingTier } from '../utils/studentPricingUtils';

// Component imports (Phase 3 additions)
import LogoutButton from './LogoutButton';
import StudentsTable from './student/StudentsTable';

// Existing component imports
import StudentProfileView from './StudentProfileView';
import StudentEditForm from './StudentEditForm';
import PaymentModal from './PaymentModal';
import AddStudentModal from './AddStudentModal';

// Lines 26-100: SMS Modal Components (Fixed with proper API calls)
const SMSCreditsModal = ({ isOpen, onClose, creditsData, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 bg-opacity-95 backdrop-blur-sm rounded-xl border border-gray-600 p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">SMS Credits Balance</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">✕</button>
        </div>
        
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
            <p className="mt-2 text-gray-300">Loading credits...</p>
          </div>
        ) : creditsData ? (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-500">₱{creditsData.balance || "0.00"}</div>
              <p className="text-gray-300">Available Balance</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="font-medium mb-2 text-white">Usage Statistics</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-gray-300">
                  <span>Cost per SMS:</span>
                  <span>₱{creditsData.costPerSMS || "0.60"}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Estimated capacity:</span>
                  <span>{Math.floor((creditsData.balance || 0) / (creditsData.costPerSMS || 0.60))} SMS</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Provider:</span>
                  <span>{creditsData.provider || "Semaphore"}</span>
                </div>
              </div>
            </div>
            {creditsData.lowBalance && (
              <div className="bg-red-500 bg-opacity-20 border border-red-500 rounded-lg p-3">
                <p className="text-red-400 text-sm">⚠️ Low balance warning</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-400">Unable to load credits data</p>
            <p className="text-gray-500 text-xs mt-2">Check SMS service configuration</p>
          </div>
        )}
        
        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const SMSHistoryModal = ({ isOpen, onClose, historyData, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 bg-opacity-95 backdrop-blur-sm rounded-xl border border-gray-600 p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">SMS History</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">✕</button>
        </div>
        
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
            <p className="mt-2 text-gray-300">Loading SMS history...</p>
          </div>
        ) : historyData?.reminders?.length > 0 ? (
          <div className="overflow-y-auto max-h-96">
            <table className="w-full text-sm">
              <thead className="bg-gray-700 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-gray-300">Date</th>
                  <th className="px-4 py-2 text-left text-gray-300">Student</th>
                  <th className="px-4 py-2 text-left text-gray-300">Phone</th>
                  <th className="px-4 py-2 text-left text-gray-300">Status</th>
                  <th className="px-4 py-2 text-left text-gray-300">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-600">
                {historyData.reminders.map((reminder, index) => (
                  <tr key={index} className="hover:bg-gray-700">
                    <td className="px-4 py-2 text-gray-300">
                      {new Date(reminder.timestamp || reminder.sentAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-white">{reminder.studentName}</td>
                    <td className="px-4 py-2 text-gray-300">{reminder.phone}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        reminder.status === 'sent' 
                          ? 'bg-green-500 bg-opacity-20 text-green-400' 
                          : 'bg-red-500 bg-opacity-20 text-red-400'
                      }`}>
                        {reminder.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-300">₱{reminder.cost || "0.60"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400">No SMS history found</p>
            <p className="text-gray-500 text-xs mt-2">SMS reminders will appear here once sent</p>
          </div>
        )}
        
        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Lines 101-150: Main DashboardPage component
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

  // SMS Modal states and data (FIXED - Using correct API endpoints)
  const [creditsModalOpen, setCreditsModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [creditsData, setCreditsData] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [smsLoading, setSmsLoading] = useState(false);

  // Student filtering and search state
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Lines 151-180: Data fetching and refresh logic
  const fetchDashboardData = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      console.log("🔄 Fetching dashboard data using adminApi with interceptors...");

      const [dashboard, studentsData] = await Promise.all([
        adminApi.getDashboardData(),
        adminApi.getAllStudents()
      ]);

      console.log("✅ Dashboard data fetched successfully:", studentsData?.length, "students");
      console.log("✅ Sample student data:", studentsData?.[0]);
      setDashboardData(dashboard);
      setStudents(studentsData || []);

    } catch (error) {
      console.error("❌ Dashboard fetch error:", error);
      setError("Failed to load dashboard data. Please try again.");
      
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const refreshData = useCallback(async () => {
    await fetchDashboardData();
    showSuccess("Data refreshed successfully!");
  }, [fetchDashboardData, showSuccess]);

  // Lines 181-205: SMS Data fetching functions (FIXED - Using correct API endpoints)
  const fetchSMSCredits = useCallback(async () => {
    try {
      setSmsLoading(true);
      console.log("🔄 Fetching SMS credits from /api/reminders/credits");
      
      // Use fetch with proper auth headers since this is a direct API call
      const response = await fetch('/api/reminders/credits', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("✅ SMS credits fetched:", result);
      
      setCreditsData(result.data || { balance: 0, costPerSMS: 0.60, provider: "Semaphore" });
    } catch (error) {
      console.error("Failed to fetch SMS credits:", error);
      setCreditsData({ balance: 0, costPerSMS: 0.60, provider: "Semaphore", error: true });
    } finally {
      setSmsLoading(false);
    }
  }, [token]);

  const fetchSMSHistory = useCallback(async () => {
    try {
      setSmsLoading(true);
      console.log("🔄 Fetching SMS history from /api/reminders/history");
      
      // Use fetch with proper auth headers since this is a direct API call
      const response = await fetch('/api/reminders/history', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("✅ SMS history fetched:", result);
      
      setHistoryData(result.data || { reminders: [] });
    } catch (error) {
      console.error("Failed to fetch SMS history:", error);
      setHistoryData({ reminders: [], error: true });
    } finally {
      setSmsLoading(false);
    }
  }, [token]);

  // Lines 206-220: Student status determination (CRITICAL - matches original logic)
  const getStudentStatus = useCallback((student) => {
    if (!student.memberships || student.memberships.length === 0) {
      return "inactive";
    }

    const latestMembership = student.memberships.reduce((latest, current) => {
      return new Date(current.startDate) > new Date(latest.startDate) ? current : latest;
    });

    const today = new Date();
    const endDate = new Date(latestMembership.endDate);
    
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    if (endDate >= today) return "active";

    const timeDiff = today.getTime() - endDate.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

    return daysDiff <= 30 ? "overdue" : "inactive";
  }, []);

  // Lines 221-240: Calculate tab counts (FIXED - using getStudentStatus)
  const tabCounts = useMemo(() => {
    if (!students || students.length === 0) {
      return { all: 0, active: 0, overdue: 0, inactive: 0 };
    }

    return students.reduce((acc, student) => {
      const status = getStudentStatus(student);
      acc[status] = (acc[status] || 0) + 1;
      acc.all = (acc.all || 0) + 1;
      return acc;
    }, { all: 0, active: 0, overdue: 0, inactive: 0 });
  }, [students, getStudentStatus]);

  // Lines 241-275: Student filtering logic (FIXED - matches original)
  const filteredStudents = useMemo(() => {
    console.log("Filtering - Original students:", students?.length);
    console.log("Active tab:", activeTab, "Search term:", searchTerm);

    if (!students || students.length === 0) return [];

    let filtered = students;

    // Filter by tab (CRITICAL - this was missing!)
    if (activeTab !== "all") {
      filtered = filtered.filter(student => getStudentStatus(student) === activeTab);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(student => {
        const name = (student.name || "").toLowerCase();
        const email = (student.email || "").toLowerCase();
        const phone = (student.phone || "").toLowerCase();
        const id = (student.id || "").toString();
        return name.includes(searchLower) || 
               email.includes(searchLower) || 
               phone.includes(searchLower) ||
               id.includes(searchLower);
      });
    }

    console.log("Filtered students result:", filtered?.length);
    return filtered;
  }, [students, activeTab, searchTerm, getStudentStatus]);

  // Lines 276-320: Calculate pricing breakdown (FIXED - Handle missing memberships properly)
  const calculatePricingBreakdown = useCallback(() => {
    if (!students || !Array.isArray(students)) {
      return {
        discounted: 0, standard: 0, legacy: 0, total: 0,
        totalMonthlyRevenuePotential: 0, totalYearlyRevenuePotential: 0
      };
    }

    const breakdown = {
      discounted: 0, standard: 0, legacy: 0, total: students.length,
      totalMonthlyRevenuePotential: 0, totalYearlyRevenuePotential: 0
    };

    students.forEach(student => {
      // Only calculate revenue for students with active memberships
      if (student.memberships && student.memberships.length > 0) {
        const tier = getPricingTier(student);
        breakdown[tier]++;

        // Calculate revenue potential based on tier
        if (tier === 'discounted') {
          breakdown.totalMonthlyRevenuePotential += 1200;
        } else if (tier === 'standard') {
          breakdown.totalMonthlyRevenuePotential += 1400;
        } else if (tier === 'legacy') {
          const pricing = getStudentPricingDisplay(student);
          if (pricing.monthlyRate) {
            breakdown.totalMonthlyRevenuePotential += pricing.monthlyRate;
          } else {
            // Fallback for legacy students without explicit rate
            breakdown.totalMonthlyRevenuePotential += 1000; // Conservative estimate
          }
        }
      }
    });

    breakdown.totalYearlyRevenuePotential = breakdown.totalMonthlyRevenuePotential * 12;
    console.log("💰 Revenue calculation:", breakdown);
    return breakdown;
  }, [students]);

  const pricingBreakdown = calculatePricingBreakdown();

  // Lines 321-380: Event handlers for student actions
  const handleViewStudent = useCallback((studentId) => {
    console.log("Viewing student:", studentId);
    setSelectedStudentId(studentId);
    setActiveView("profile");
  }, []);

  const handleEditStudent = useCallback((student) => {
    console.log("Editing student:", student);
    setStudentToEdit(student);
    setActiveView("edit");
  }, []);

  const handleProcessPayment = useCallback((student) => {
    setSelectedStudent(student);
    setPaymentModalOpen(true);
  }, []);

  const handleSendReminder = useCallback(async (student) => {
    try {
      console.log("🔄 Sending SMS reminder to:", student.name);
      
      // Use fetch with proper auth headers for SMS API
      const response = await fetch('/api/reminders/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          studentId: student.id,
          testMode: process.env.NODE_ENV === "development",
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("✅ SMS reminder result:", result);

      if (result.success) {
        showSuccess(`SMS reminder sent to ${student.name}!`);
        // Refresh SMS history if modal is open
        if (historyModalOpen) {
          fetchSMSHistory();
        }
      } else {
        throw new Error(result.error || "Failed to send SMS");
      }
    } catch (error) {
      console.error("SMS reminder error:", error);
      showError(`Failed to send SMS: ${error.message}`);
    }
  }, [showSuccess, showError, historyModalOpen, fetchSMSHistory, token]);

  const handleSaveStudent = useCallback(async (updatedStudent) => {
    try {
      const savedStudent = await adminApi.updateStudent(updatedStudent.id, updatedStudent);
      
      setStudents(students => 
        students.map(s => s.id === savedStudent.id ? { ...s, ...savedStudent } : s)
      );

      setActiveView("dashboard");
      setSelectedStudentId(null);
      setStudentToEdit(null);
      
      showSuccess(`${String(updatedStudent.name)} updated successfully!`);
      
    } catch (error) {
      console.error("handleSaveStudent: Error occurred", error);
      showError(`Failed to update student: ${String(error.message)}`);
      throw error;
    }
  }, [showSuccess, showError]);

  const handleBackToDashboard = useCallback(() => {
    console.log("🔙 Back to dashboard clicked");
    setActiveView("dashboard");
    setSelectedStudentId(null);
    setStudentToEdit(null);
  }, []);

  // Lines 381-395: SMS Modal handlers
  const handleOpenCreditsModal = useCallback(() => {
    setCreditsModalOpen(true);
    fetchSMSCredits();
  }, [fetchSMSCredits]);

  const handleOpenHistoryModal = useCallback(() => {
    setHistoryModalOpen(true);
    fetchSMSHistory();
  }, [fetchSMSHistory]);

  // Lines 396-435: Loading and error states
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading dashboard...</p>
          <p className="text-gray-400 text-sm mt-2">Using enhanced auth interceptors...</p>
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
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={refreshData}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Lines 436-465: Conditional view rendering (FIXED - Better debugging)
  if (activeView === "profile" && selectedStudentId) {
    console.log("🔍 Rendering profile view for student:", selectedStudentId);
    return (
      <StudentProfileView
        studentId={selectedStudentId}
        onBack={handleBackToDashboard}
        onEdit={handleEditStudent}
      />
    );
  }

  if (activeView === "edit" && studentToEdit) {
    console.log("✏️ Rendering edit form for student:", studentToEdit?.name);
    return (
      <StudentEditForm
        student={studentToEdit}
        onSave={handleSaveStudent}
        onCancel={handleBackToDashboard}
      />
    );
  }

  // Lines 466-800: Main dashboard render
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header - Dark Theme */}
      <header className="bg-gray-800 bg-opacity-90 backdrop-blur-sm shadow-xl border-b border-gray-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-white">
                Student Membership Dashboard
              </h1>
              <p className="text-gray-300 mt-1">Welcome back, {user?.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={refreshData}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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
        {/* Statistics Cards */}
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
                      {students?.length || 0}
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

          {/* Overdue Students Card */}
          <div className="bg-gray-800 bg-opacity-90 backdrop-blur-sm overflow-hidden shadow-xl rounded-xl border border-gray-600">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-3xl">⚠️</span>
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

          {/* Inactive Students Card */}
          <div className="bg-gray-800 bg-opacity-90 backdrop-blur-sm overflow-hidden shadow-xl rounded-xl border border-gray-600">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-3xl">😴</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">Inactive</dt>
                    <dd className="text-3xl font-bold text-gray-400">{tabCounts.inactive || 0}</dd>
                    <dd className="text-sm text-gray-500">No membership</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Card */}
          <div className="bg-gray-800 bg-opacity-90 backdrop-blur-sm overflow-hidden shadow-xl rounded-xl border border-gray-600">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-3xl">💰</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">Monthly Revenue</dt>
                    <dd className="text-2xl font-bold text-yellow-400">
                      ₱{pricingBreakdown.totalMonthlyRevenuePotential.toLocaleString()}
                    </dd>
                    <dd className="text-sm text-gray-500">Potential income</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Distribution Section */}
        {pricingBreakdown.total > 0 && (
          <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-xl border border-gray-600 p-6 mb-8">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
              <span className="mr-2">📊</span>
              Pricing Distribution
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              {/* Discounted Members */}
              {pricingBreakdown.discounted > 0 && (
                <div className="text-center p-4 bg-purple-500 bg-opacity-10 rounded-lg border border-purple-500 border-opacity-30">
                  <div className="text-3xl font-bold text-purple-400">{pricingBreakdown.discounted}</div>
                  <div className="text-sm text-purple-300 font-medium">💜 Discounted</div>
                  <div className="text-xs text-gray-400 mt-1">₱1,200/month</div>
                  <div className="text-xs text-purple-400 mt-1">
                    ₱{(pricingBreakdown.discounted * 1200).toLocaleString()}/mo revenue
                  </div>
                </div>
              )}
              
              {/* Legacy Members */}
              {pricingBreakdown.legacy > 0 && (
                <div className="text-center p-4 bg-yellow-500 bg-opacity-10 rounded-lg border border-yellow-500 border-opacity-30">
                  <div className="text-3xl font-bold text-yellow-400">{pricingBreakdown.legacy}</div>
                  <div className="text-sm text-yellow-300 font-medium">🌟 Legacy</div>
                  <div className="text-xs text-gray-400 mt-1">Various rates</div>
                  <div className="text-xs text-yellow-400 mt-1">Legacy pricing</div>
                </div>
              )}
              
              {/* Standard Members */}
              <div className="text-center p-4 bg-green-500 bg-opacity-10 rounded-lg border border-green-500 border-opacity-30">
                <div className="text-3xl font-bold text-green-400">{pricingBreakdown.standard}</div>
                <div className="text-sm text-green-300 font-medium">Standard Members</div>
                <div className="text-xs text-gray-400 mt-1">₱1,400/month</div>
                <div className="text-xs text-green-400 mt-1">
                  ₱{(pricingBreakdown.standard * 1400).toLocaleString()}/mo revenue
                </div>
              </div>
            </div>
            
            {/* Revenue Potential Summary */}
            <div className="mt-6 p-4 bg-gray-700 bg-opacity-50 rounded-lg">
              <h4 className="text-sm font-medium text-white mb-3">💡 Revenue Analysis</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-400">
                    ₱{pricingBreakdown.totalMonthlyRevenuePotential.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-400">Monthly Potential</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-400">
                    ₱{pricingBreakdown.totalYearlyRevenuePotential.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-400">Yearly Potential</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-400">
                    ₱{Math.round((pricingBreakdown.totalMonthlyRevenuePotential / pricingBreakdown.total) || 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-400">Avg/Student</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Student Management Section - Dark Theme */}
        <div className="bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-xl border border-gray-600 shadow-xl">
          {/* Tabs */}
          <div className="border-b border-gray-600">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { key: 'all', label: 'All Students', count: tabCounts.all },
                { key: 'active', label: 'Active', count: tabCounts.active },
                { key: 'overdue', label: 'Overdue', count: tabCounts.overdue },
                { key: 'inactive', label: 'Inactive', count: tabCounts.inactive }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors
                    ${activeTab === tab.key
                      ? 'border-blue-400 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-white hover:border-gray-400'
                    }
                  `}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </nav>
          </div>

          {/* Search and Filters */}
          <div className="p-6 border-b border-gray-600">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search students by name, email, phone, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="sm:w-48">
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="overdue">Overdue Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Students Table */}
          <StudentsTable
            students={filteredStudents}
            loading={loading}
            onProcessPayment={handleProcessPayment}
            onViewStudent={handleViewStudent}
            onEditStudent={handleEditStudent}
            onSendReminder={handleSendReminder}
            getStudentStatus={getStudentStatus}
          />

          {/* Action Buttons */}
          <div className="px-6 py-4 border-t border-gray-600">
            <div className="flex gap-3">
              <button
                onClick={() => setAddStudentModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                👤 Add Student
              </button>
              <button
                onClick={() => setPaymentModalOpen(true)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                💳 Quick Payment
              </button>
              <button
                onClick={handleOpenCreditsModal}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
              >
                💬 SMS Credits
              </button>
              <button
                onClick={handleOpenHistoryModal}
                className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
              >
                📱 SMS History
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      {paymentModalOpen && (
        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false);
            setSelectedStudent(null);
          }}
          student={selectedStudent}
          onPaymentSuccess={() => {
            refreshData();
            setPaymentModalOpen(false);
            setSelectedStudent(null);
            showSuccess("Payment processed successfully!");
          }}
        />
      )}

      {addStudentModalOpen && (
        <AddStudentModal
          isOpen={addStudentModalOpen}
          onClose={() => setAddStudentModalOpen(false)}
          onStudentAdded={() => {
            refreshData();
            setAddStudentModalOpen(false);
            showSuccess("Student added successfully!");
          }}
        />
      )}

      {/* SMS Modal Components - COMPLETELY FIXED with correct API endpoints! */}
      <SMSCreditsModal 
        isOpen={creditsModalOpen}
        onClose={() => setCreditsModalOpen(false)}
        creditsData={creditsData}
        loading={smsLoading}
      />
      
      <SMSHistoryModal 
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        historyData={historyData}
        loading={smsLoading}
      />
    </div>
  );
}