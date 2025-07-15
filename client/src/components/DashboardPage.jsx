// Line 1: Complete DashboardPage.jsx with SMS reminder integration
// Enhanced existing dashboard with SMS functionality using clean architecture
import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import PaymentModal from "../components/PaymentModal";
import AddStudentModal from "../components/AddStudentModal";
import LogoutButton from "../components/LogoutButton";
import StudentProfileView from "../components/StudentProfileView";
import StudentEditForm from "./StudentEditForm";
import { useToast } from "../hooks/useToast";

// Line 13: Import SMS-related components and hooks
import { SMSCreditsModal, SMSHistoryModal } from "./SMSModals";

// Line 16: Custom hook for SMS reminder functionality
const useSMSReminders = (token) => {
  const [smsLoading, setSmsLoading] = useState(false);
  const [lastReminderTime, setLastReminderTime] = useState({});
  const { showSuccess, showError } = useToast();

  // Line 22: Rate limiting check - 24 hour cooldown per student
  const canSendReminder = React.useCallback(
    (student) => {
      if (
        !student?.phone ||
        (student.status !== "OVERDUE" && student.status !== "EXPIRED")
      ) {
        return false;
      }

      const lastReminder = lastReminderTime[student.id];
      const now = Date.now();
      const cooldownMs = 24 * 60 * 60 * 1000;
      return !lastReminder || now - lastReminder >= cooldownMs;
    },
    [lastReminderTime]
  );

  // Line 33: Send SMS reminder function
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
          `Please wait ${hoursLeft} more hours before sending another reminder to ${student.firstName}`
        );
        return false;
      }

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
            message: `Hi ${student.firstName}! Your membership payment is overdue. Please settle your account to continue accessing our services. Thank you!`,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Failed to send reminder");
        }

        // Line 61: Update rate limiting state
        setLastReminderTime((prev) => ({
          ...prev,
          [student.id]: Date.now(),
        }));

        showSuccess(
          `✅ SMS sent to ${student.firstName} (${result.data.phoneNumber}) - Cost: ₱${result.data.cost}`
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

// Line 79: Custom hook for SMS modals management
const useSMSModals = (token) => {
  const [creditsModalOpen, setCreditsModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [creditsData, setCreditsData] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const { showError } = useToast();

  // Line 87: Fetch SMS credits data
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

  // Line 107: Fetch SMS history data
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

// Line 139: SMS Header Controls Component
const SMSHeaderControls = ({
  onCheckCredits,
  onViewHistory,
  loading = false,
}) => {
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

// Line 160: SMS Action Button Component
const SMSActionButton = ({
  student,
  canSendReminder,
  onSendReminder,
  loading = false,
}) => {
  const isOverdue =
    student.status === "OVERDUE" || student.status === "EXPIRED";
  const showButton = canSendReminder(student);

  // Don't render anything if not overdue
  if (!isOverdue) return null;

  // Show status indicators for overdue students
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

  // Render active SMS reminder button
  return (
    <button
      onClick={() => onSendReminder(student)}
      disabled={loading}
      className="bg-orange-600 text-white px-3 py-1 rounded text-xs hover:bg-orange-700 transition-colors disabled:opacity-50"
      title={`Send payment reminder to ${student.firstName}`}
    >
      📱 Remind
    </button>
  );
};

// Line 191: Main Dashboard Component
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

  // Existing modal states
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [addStudentModalOpen, setAddStudentModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Student filtering and search state
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");

  // Line 214: Integrate SMS hooks
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

  // Line 235: Enhanced refresh function to clear error states
  const refreshData = () => {
    setError(null);
    fetchDashboardData();
  };

  // Line 240: Fetch dashboard and student data
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
        throw new Error(
          `Dashboard: ${dashboardRes.status}, Students: ${studentsRes.status}`
        );
      }

      const [dashboardData, studentsData] = await Promise.all([
        dashboardRes.json(),
        studentsRes.json(),
      ]);

      console.log("Dashboard Data:", dashboardData);
      console.log("Students Data:", studentsData);

      setDashboardData(dashboardData);
      setStudents(studentsData.data || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError("Failed to load dashboard data. Please try again.");
      showError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  // Line 280: Enhanced handleSendReminder with data refresh
  const handleSendReminder = async (student) => {
    const success = await sendReminder(student);
    if (success) {
      fetchDashboardData(); // Refresh data after successful send
    }
  };

  // Line 287: Existing handler functions - unchanged
  const handleProcessPayment = (student) => {
    setSelectedStudent(student);
    setPaymentModalOpen(true);
  };

  const handleViewStudent = (studentId) => {
    setSelectedStudentId(studentId);
    setActiveView("profile");
  };

  const handleEditStudent = (student) => {
    setStudentToEdit(student);
    setEditMode(true);
    setActiveView("edit");
  };

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

  // Line 313: Enhanced filtering logic with search and filters
  const filteredStudents = useMemo(() => {
    let filtered = students;

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (student) =>
          student.firstName?.toLowerCase().includes(searchLower) ||
          student.lastName?.toLowerCase().includes(searchLower) ||
          student.email?.toLowerCase().includes(searchLower) ||
          student.phone?.includes(searchTerm)
      );
    }

    // Filter by membership type and status
    if (selectedFilter !== "all") {
      filtered = filtered.filter((student) => {
        switch (selectedFilter) {
          case "monthly":
            return student.membershipType === "MONTHLY";
          case "yearly":
            return student.membershipType === "YEARLY";
          case "expired":
            return student.status === "EXPIRED" || student.status === "OVERDUE";
          default:
            return true;
        }
      });
    }

    // Filter by tab
    if (activeTab !== "all") {
      filtered = filtered.filter((student) => {
        switch (activeTab) {
          case "active":
            return student.status === "ACTIVE";
          case "inactive":
            return student.status === "INACTIVE";
          case "overdue":
            return student.status === "OVERDUE" || student.status === "EXPIRED";
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [students, searchTerm, selectedFilter, activeTab]);

  // Line 355: Loading and error states
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

  // Line 371: Conditional view rendering for profile and edit
  if (activeView === "profile" && selectedStudentId) {
    const selectedStudentData = students.find(
      (s) => s.id === selectedStudentId
    );
    return (
      <StudentProfileView
        student={selectedStudentData}
        onBack={() => setActiveView("dashboard")}
        onEdit={() => handleEditStudent(selectedStudentData)}
      />
    );
  }

  if (activeView === "edit" && studentToEdit) {
    return (
      <StudentEditForm
        student={studentToEdit}
        onBack={() => setActiveView("dashboard")}
        onSave={() => {
          fetchDashboardData();
          setActiveView("dashboard");
          setStudentToEdit(null);
          setEditMode(false);
          showSuccess("Student updated successfully!");
        }}
      />
    );
  }

  // Line 395: Main dashboard render
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
              {/* Line 407: SMS header controls */}
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

      {/* Line 488: SMS Modals */}
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

// Line 504: Enhanced StudentsTable component with SMS reminder functionality
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
          {students.map((student) => (
            <StudentRow
              key={student.id}
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

// Line 560: Enhanced StudentRow component with SMS reminder button
const StudentRow = ({
  student,
  onProcessPayment,
  onViewStudent,
  onEditStudent,
  onSendReminder,
  canSendReminder,
  smsLoading,
}) => {
  const getStatusBadge = (status) => {
    const badges = {
      ACTIVE: "bg-green-100 text-green-800",
      INACTIVE: "bg-gray-100 text-gray-800",
      OVERDUE: "bg-red-100 text-red-800",
      EXPIRED: "bg-red-100 text-red-800",
    };
    return badges[status] || "bg-gray-100 text-gray-800";
  };

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

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {student.firstName} {student.lastName}
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
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(
            student.status
          )}`}
        >
          {student.status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">
          {student.membershipType} - ${student.membershipFee}
        </div>
        <div className="text-sm text-gray-500">
          Started: {new Date(student.startDate).toLocaleDateString()}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {formatDueDate(student.nextPaymentDate)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
        {/* Line 623: SMS Reminder Button - conditional rendering */}
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

// Line 652: SummaryCards component - unchanged from original
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
      value: `$${data.totalRevenue || 0}`,
      subtitle: `$${data.thisMonthRevenue || 0} this month`,
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

// Line 689: StatsCard component - unchanged from original
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

// Line 710: StudentTabs component - unchanged from original
const StudentTabs = ({ activeTab, setActiveTab, students }) => {
  const tabs = [
    { id: "all", label: "All Students", count: students.length },
    {
      id: "active",
      label: "Active",
      count: students.filter((s) => s.status === "ACTIVE").length,
    },
    {
      id: "inactive",
      label: "Inactive",
      count: students.filter((s) => s.status === "INACTIVE").length,
    },
    {
      id: "overdue",
      label: "Overdue",
      count: students.filter(
        (s) => s.status === "OVERDUE" || s.status === "EXPIRED"
      ).length,
    },
  ];

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

// Line 742: SearchAndFilters component - unchanged from original
const SearchAndFilters = ({
  searchTerm,
  setSearchTerm,
  selectedFilter,
  setSelectedFilter,
  students,
}) => {
  const filterCounts = useMemo(() => {
    return {
      monthlyCount: students.filter((s) => s.membershipType === "MONTHLY")
        .length,
      yearlyCount: students.filter((s) => s.membershipType === "YEARLY").length,
      expiredCount: students.filter(
        (s) => s.status === "EXPIRED" || s.status === "OVERDUE"
      ).length,
    };
  }, [students]);

  return (
    <div className="px-6 py-4 border-b border-gray-200">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="w-full sm:w-64">
          <select
            value={selectedFilter}
            onChange={(e) => {
              console.log("Filter changed to:", e.target.value);
              setSelectedFilter(e.target.value);
            }}
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

      {/* Debug info - remove after testing */}
      {selectedFilter !== "all" && (
        <div className="mt-2 text-xs text-gray-500">
          Active filter: {selectedFilter}
        </div>
      )}
    </div>
  );
};
