import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";

export default function DashboardPage() {
  const { user, token } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
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
      fetch("/api/students", { // Make sure this endpoint exists and returns data
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
    ]);

    if (!dashboardRes.ok || !studentsRes.ok) {
      throw new Error(`Dashboard: ${dashboardRes.status}, Students: ${studentsRes.status}`);
    }

    const [dashboardData, studentsData] = await Promise.all([
      dashboardRes.json(),
      studentsRes.json()
    ]);

    console.log("Dashboard Data:", dashboardData);
    console.log("Students Data:", studentsData); // DEBUG: Check structure

    setDashboardData(dashboardData);
    
    // Handle different possible response structures
    const students = studentsData.students || studentsData.data || studentsData || [];
    console.log("Processed Students:", students); // DEBUG: Check processed data
    
    setStudents(students);
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
    setError(error.message);
  } finally {
    setLoading(false);
  }
};

  // Memoized filtered students for performance
const filteredStudents = useMemo(() => {
  console.log("Filtering - Original students:", students);
  console.log("Active tab:", activeTab, "Search term:", searchTerm);
  
  let filtered = students;

  // Filter by tab - Updated to work with your membership data
  if (activeTab === "active") {
    filtered = filtered.filter(student => {
      // Check if student has active memberships
      const hasActiveMembership = student.memberships && 
        student.memberships.some(membership => {
          const endDate = new Date(membership.endDate);
          const now = new Date();
          return endDate > now; // membership hasn't expired
        });
      return hasActiveMembership;
    });
  } else if (activeTab === "inactive") {
    filtered = filtered.filter(student => {
      // No memberships or all memberships expired
      const hasActiveMembership = student.memberships && 
        student.memberships.some(membership => {
          const endDate = new Date(membership.endDate);
          const now = new Date();
          return endDate > now;
        });
      return !hasActiveMembership;
    });
  }

  // Filter by search term - Updated for your API structure
  if (searchTerm) {
    filtered = filtered.filter(student => {
      const name = (student.name || "").toLowerCase();
      const email = (student.email || "").toLowerCase();
      const searchLower = searchTerm.toLowerCase();
      
      const matches = name.includes(searchLower) || email.includes(searchLower);
      console.log(`Search "${searchTerm}" - Student: ${name}, Email: ${email}, Matches: ${matches}`);
      
      return matches;
    });
  }

  console.log("Filtered students result:", filtered);
  return filtered;
}, [students, activeTab, searchTerm]);

  const refreshData = () => {
    fetchDashboardData();
  };

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;
  if (error) return <ErrorMessage message={error} onRetry={refreshData} />;
  if (!dashboardData) return <ErrorMessage message="No dashboard data available" />;

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
            <button 
              onClick={refreshData}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh Data
            </button>
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
          />

          {/* Students Table */}
          <StudentsTable 
            students={filteredStudents}
            loading={loading}
          />

          {/* Quick Actions */}
          <QuickActions />
        </div>

        {/* Data Timestamp */}
        <div className="mt-6 text-center text-sm text-gray-500">
          Last updated: {new Date(dashboardData.timestamp).toLocaleString()}
        </div>
      </main>
    </div>
  );
}

// Summary Cards Component
const SummaryCards = ({ data }) => {
  // You might need to calculate these from your students array
  // since your API structure might be different
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
    
    return student.memberships.some(membership => {
      const endDate = new Date(membership.endDate);
      const now = new Date();
      return endDate > now;
    });
  };

  const activeCount = students.filter(isStudentActive).length;
  const inactiveCount = students.length - activeCount;

  const tabs = [
    { 
      id: "all", 
      label: "All", 
      count: students.length 
    },
    { 
      id: "active", 
      label: "Active", 
      count: activeCount
    },
    { 
      id: "inactive", 
      label: "Inactive", 
      count: inactiveCount
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
const SearchAndFilters = ({ searchTerm, setSearchTerm, selectedFilter, setSelectedFilter }) => {
  return (
    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Bar */}
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400">🔍</span>
            </div>
            <input
              type="text"
              placeholder="Search students by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Filter Dropdown */}
        <div className="sm:w-48">
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Memberships</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>
    </div>
  );
};

// Students Table Component
const StudentsTable = ({ students, loading }) => {
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
              Name
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
            <StudentRow key={student.id} student={student} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Student Row Component
const StudentRow = ({ student }) => {
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

    student.memberships.forEach(membership => {
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
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}>
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
            <div className="text-sm text-gray-500">{student.email || "No email"}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {getStatusBadge(studentStatus)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {latestMembership?.membershipType || "No Membership"}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {formatDate(latestMembership?.endDate)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
        <button 
          onClick={() => console.log("View student:", student.id)}
          className="text-blue-600 hover:text-blue-900 transition-colors"
        >
          View
        </button>
        <button 
          onClick={() => console.log("Edit student:", student.id)}
          className="text-indigo-600 hover:text-indigo-900 transition-colors"
        >
          Edit
        </button>
        <button 
          onClick={() => console.log("Contact student:", student.email)}
          className="text-green-600 hover:text-green-900 transition-colors"
        >
          Contact
        </button>
      </td>
    </tr>
  );
};

// Quick Actions Component
const QuickActions = () => {
  return (
    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
      <div className="flex flex-col sm:flex-row gap-3">
        <button className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <span className="mr-2">👤</span>
          Add Student
        </button>
        <button className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
          <span className="mr-2">💳</span>
          Process Payment
        </button>
      </div>
    </div>
  );
};