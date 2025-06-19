import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import PaymentModal from "../components/PaymentModal";
import AddStudentModal from "../components/AddStudentModal";
import LogoutButton from "../components/LogoutButton";
import StudentProfileView from "../components/StudentProfileView";
import StudentEditForm from "./StudentEditForm";

export default function DashboardPage() {
  const { user, token } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState(null);

  // View state management
  const [activeView, setActiveView] = useState("dashboard"); // "dashboard" | "profile"
  const [selectedStudentId, setSelectedStudentId] = useState(null);



  // Modal states
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [addStudentModalOpen, setAddStudentModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Student filtering and search state
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");

  useEffect(() => {
    fetchDashboardData();
  }, []);

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

      // Handle different possible response structures
      const students =
        studentsData.students || studentsData.data || studentsData || [];
      console.log("Processed Students:", students);

      setStudents(students);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // View handlers
  const handleViewStudent = (student) => {
    setSelectedStudentId(student.id);
    setActiveView("profile");
  };

  const handleBackToDashboard = () => {
    setActiveView("dashboard");
    setSelectedStudentId(null);
    setEditMode(false);
    setStudentToEdit(null);
  };

  const handleEditStudent = (student) => {
    setStudentToEdit(student);
    setEditMode(true);
  }

  const handleSaveStudent = async (updatedStudent) => {
    try {
       const response = await fetch("/api/students", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {

        } else {}
    } catch (error) {
      console.error('Error updating student:', error);
      throw error;
    }
  }

  const handleProcessPayment = (student) => {
    setSelectedStudent(student);
    setPaymentModalOpen(true);
  };

  const handlePaymentSuccess = (paymentResult) => {
    console.log("Payment successful:", paymentResult);
    // Refresh dashboard data to show updated information
    fetchDashboardData();

    // Extract amount from multiple possible sources
    const amount =
      paymentResult.amount ||
      paymentResult.payment?.amount ||
      paymentResult.data?.amount ||
      "0";

    const studentName = paymentResult.student?.name || "Student";

    // Show success message with proper data
    alert(`Payment of ${amount} processed successfully for ${studentName}!`);
  };

  const handleStudentAdded = (newStudent) => {
    alert(`Student ${newStudent.name} added successfully!`);
    fetchDashboardData();
    setAddStudentModalOpen(false); // Close the modal
  };

  // Helper functions for student status
  const isStudentActive = (student) => {
    if (!student.memberships || student.memberships.length === 0) return false;
    return student.memberships.some((membership) => {
      const endDate = new Date(membership.endDate);
      const now = new Date();
      return endDate > now;
    });
  };

  const isStudentOverdue = (student) => {
    if (!student.memberships || student.memberships.length === 0) return false;
    const now = new Date();
    return student.memberships.some((membership) => {
      const endDate = new Date(membership.endDate);
      const daysSinceExpired = (now - endDate) / (1000 * 60 * 60 * 24);
      return daysSinceExpired > 0 && daysSinceExpired <= 30;
    });
  };

  // Memoized filtered students for performance
  const filteredStudents = useMemo(() => {
    console.log("Filtering - Original students:", students);
    console.log(
      "Active tab:",
      activeTab,
      "Search term:",
      searchTerm,
      "Selected filter:",
      selectedFilter
    );

    let filtered = students;

    // Filter by tab
    if (activeTab === "active") {
      filtered = filtered.filter(isStudentActive);
    } else if (activeTab === "inactive") {
      filtered = filtered.filter(
        (student) => !isStudentActive(student) && !isStudentOverdue(student)
      );
    } else if (activeTab === "overdue") {
      filtered = filtered.filter(isStudentOverdue);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (student) =>
          student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by membership type
    if (selectedFilter !== "all") {
      filtered = filtered.filter((student) => {
        const latestMembership = student.memberships?.[0];
        if (selectedFilter === "expired") {
          return (
            latestMembership && new Date(latestMembership.endDate) < new Date()
          );
        }
        return latestMembership?.type?.toLowerCase() === selectedFilter;
      });
    }

    return filtered;
  }, [students, activeTab, searchTerm, selectedFilter]);

  // Conditional rendering based on activeView
  if (activeView === "profile" && selectedStudentId) {
    if(editMode && studentToEdit) {
      return (
        <StudentEditForm
          student={studentToEdit}
          onSave={handleSaveStudent}
          onCancel={handleCancelEdit}
        />
      )
    }
    return (
      <StudentProfileView
        studentId={selectedStudentId}
        onBack={handleBackToDashboard}
        onEdit={() => {
          const student = students.find(s => s.id === selectedStudentId);
          if(student) {
            handleEditStudent(student);
          }
        }}
      />
    );
  }

  // Show loading or error states
  if (loading) return <LoadingSpinner message="Loading dashboard..." />;
  if (error)
    return <ErrorMessage message={error} onRetry={fetchDashboardData} />;
  if (!dashboardData) return <div>No data available</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
              <button
                onClick={fetchDashboardData}
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

          {/* Students Table */}
          <StudentsTable
            students={filteredStudents}
            loading={loading}
            onProcessPayment={handleProcessPayment}
            onViewStudent={handleViewStudent}
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

      {/* Modals */}
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
    </div>
  );
}

// Summary Cards Component
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

// Stats Card Component
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
          <p className="text-2xl font-bold mt-1">{value}</p>
          <p className="text-xs opacity-60 mt-1">{subtitle}</p>
        </div>
        <div className="text-2xl ml-2">{icon}</div>
      </div>
    </div>
  );
};

// Student Tabs Component
const StudentTabs = ({ activeTab, setActiveTab, students }) => {
  // Helper function to determine if student is active
  const isStudentActive = (student) => {
    if (!student.memberships || student.memberships.length === 0) return false;
    return student.memberships.some((membership) => {
      const endDate = new Date(membership.endDate);
      const now = new Date();
      return endDate > now;
    });
  };

  // Helper function to determine if student is overdue
  const isStudentOverdue = (student) => {
    if (!student.memberships || student.memberships.length === 0) return false;
    const now = new Date();
    return student.memberships.some((membership) => {
      const endDate = new Date(membership.endDate);
      const daysSinceExpired = (now - endDate) / (1000 * 60 * 60 * 24);
      return daysSinceExpired > 0 && daysSinceExpired <= 30;
    });
  };

  const activeCount = students.filter(isStudentActive).length;
  const overdueCount = students.filter(isStudentOverdue).length;
  const inactiveCount = Math.max(
    0,
    students.length - activeCount - overdueCount
  );

  const tabs = [
    {
      id: "all",
      label: "All",
      count: students.length,
    },
    {
      id: "active",
      label: "Active",
      count: activeCount,
    },
    {
      id: "overdue",
      label: "Overdue",
      count: overdueCount,
    },
    {
      id: "inactive",
      label: "Inactive",
      count: inactiveCount,
    },
  ];

  return (
    <div className="border-b border-gray-200">
      <div className="px-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

// Search and Filters Component
const SearchAndFilters = ({
  searchTerm,
  setSearchTerm,
  selectedFilter,
  setSelectedFilter,
  students,
}) => {
  // Calculate filter counts
  const filterCounts = useMemo(() => {
    const monthlyCount = students.filter((student) =>
      student.memberships?.some((m) => m.type?.toLowerCase() === "monthly")
    ).length;

    const yearlyCount = students.filter((student) =>
      student.memberships?.some((m) => m.type?.toLowerCase() === "yearly")
    ).length;

    const expiredCount = students.filter((student) =>
      student.memberships?.some((m) => new Date(m.endDate) < new Date())
    ).length;

    return { monthlyCount, yearlyCount, expiredCount };
  }, [students]);

  return (
    <div className="px-6 py-4 border-b border-gray-200">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search students by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Filter Dropdown */}
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

// Students Table Component
const StudentsTable = ({
  students,
  loading,
  onProcessPayment,
  onViewStudent,
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
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Student Row Component - UPDATED TO REMOVE CONSOLE.LOG
const StudentRow = ({ student, onProcessPayment, onViewStudent }) => {
  if (!student) {
    console.warn("StudentRow received null/undefined student");
    return null;
  }

  // Helper function to determine student status based on memberships
  const getStudentStatus = (student) => {
    if (!student.memberships || student.memberships.length === 0) {
      return "inactive";
    }

    const now = new Date();
    let hasActive = false;
    let hasOverdue = false;

    student.memberships.forEach((membership) => {
      const endDate = new Date(membership.endDate);
      if (endDate > now) {
        hasActive = true;
      } else {
        // Check if overdue (expired recently, within 30 days)
        const daysSinceExpired = (now - endDate) / (1000 * 60 * 60 * 24);
        if (daysSinceExpired <= 30) {
          hasOverdue = true;
        }
      }
    });

    if (hasActive) return "active";
    if (hasOverdue) return "overdue";
    return "inactive";
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { bg: "bg-green-100", text: "text-green-800", label: "Active" },
      inactive: { bg: "bg-gray-100", text: "text-gray-800", label: "Inactive" },
      overdue: { bg: "bg-red-100", text: "text-red-800", label: "Overdue" },
    };

    const config = statusConfig[status] || statusConfig.inactive;

    return (
      <span
        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      console.warn("Invalid date:", dateString);
      return "Invalid Date";
    }
  };

  // Get the most recent membership for due date
  const getLatestMembership = (memberships) => {
    if (!memberships || memberships.length === 0) return null;

    return memberships.reduce((latest, current) => {
      const currentDate = new Date(current.endDate);
      const latestDate = new Date(latest.endDate);
      return currentDate > latestDate ? current : latest;
    });
  };

  // Default handlers for actions that don't have props yet
  const handleEditStudent = () => {
    // Placeholder for edit functionality
    alert(`Edit functionality for ${student.name} is not implemented yet.`);
  };

  const handleContactStudent = () => {
    // Placeholder for contact functionality
    if (student.email) {
      window.location.href = `mailto:${student.email}`;
    } else {
      alert(`No email address available for ${student.name}.`);
    }
  };

  const studentStatus = getStudentStatus(student);
  const latestMembership = getLatestMembership(student.memberships);

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div>
            <div className="text-sm font-medium text-gray-900">
              {student.name || "Unknown"}
            </div>
            <div className="text-sm text-gray-500">
              {student.email || "No email"}
            </div>
            {student.phone && (
              <div className="text-xs text-gray-400">{student.phone}</div>
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {getStatusBadge(studentStatus)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {latestMembership?.type ||
          latestMembership?.membershipType ||
          "No Membership"}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {formatDate(latestMembership?.endDate)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
        <button
          onClick={() => onProcessPayment(student)}
          className="text-green-600 hover:text-green-900 transition-colors font-medium"
          title="Process Payment"
        >
          💳 Payment
        </button>
        <button
          onClick={() => onViewStudent(student)}
          className="text-blue-600 hover:text-blue-900 transition-colors"
          title="View Student Profile"
        >
          View
        </button>
        <button
          onClick={handleEditStudent}
          className="text-indigo-600 hover:text-indigo-900 transition-colors"
          title="Edit Student"
        >
          Edit
        </button>
        <button
          onClick={handleContactStudent}
          className="text-purple-600 hover:text-purple-900 transition-colors"
          title="Contact Student"
        >
          Contact
        </button>
      </td>
    </tr>
  );
};
