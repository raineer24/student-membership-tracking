import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";

export default function DashboardPage() {
  const { user, token } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    fetchDashboardData();
  };

  if (loading) return <LoadingSpinner message="Loading dasboard..." />;
  if (error) return <ErrorMessage message={error} onRetry={refreshData} />;
  if (!dashboardData)
    return <ErrorMessage message="No dashboard data available " />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Welcome back, {user?.email}</p>
            </div>
            <button className="bg-blue-600 text-white px-4 rounded-lg hover:bg-blue-700 transition-colors">
              refresh data
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white">
        <div className="max-w-7xl">
          <div className="flex">
            {[
              { id: "overview", label: "Overview" },
              { id: "students", label: "Students" },
              { id: "revenue", label: "Revenue" },
              { id: "activity", label: "Recent Activity" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7x mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "overview" && (
          <DashboardOverview data={dashboardData} token={token} />
        )}
        {activeTab === "students" && <StudentsTab token={token} />}
        {activeTab === "revenue" && <RevenueTab token={token} />}
        {activeTab === "activity" && <ActivityTab token={token} />}
      </main>
    </div>
  );
}

//Dashboard overview component
const DashboardOverview = ({ data }) => {
  const { summary, timestamp } = data;

  const statsCard = [
    {
      title: "Total Students",
      value: summary.totalStudents,
      subtitle: `${summary.activeStudents} active • ${summary.inactiveStudents} inactive`,
      icon: "👥",
      color: "blue",
    },
     {
      title: "Memberships",
      value: summary.totalMemberships,
      subtitle: `${summary.activeMemberships} active • ${summary.expiredMemberships} expired`,
      icon: "👥",
      color: "green",
    },
     {
      title: "Total Revenue",
      value: `$${summary.totalRevenue}`,
      subtitle: `$${summary.thisMonthRevenue} this month`,
      icon: '💰',
      color: "yellow",
    },
     {
      title: "Pending Payments",
      value: summary.pendingPayments,
      subtitle: 'Students with overdue memberships',
      icon: '⚠️',
      color: "red",
    },
  ];

  return (
    <div className="space-y-6"></div>
  )
};


// Stats Card component
