import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import DashboardHeader from "../components/student/DashboardHeader";
import MembershipCard from "../components/student/MembershipCard";
import PaymentHistory from "../components/student/PaymentHistory";
import QuickActions from "../components/student/QuickActions";
import { studentApi } from "../services/studentApi";

const StudentDashboard = () => {
  const { user, loading: authLoading, logout } = useAuth();
  const [data, setData] = useState({
    student: null,
    membership: null,
    payments: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Wait for auth to load and check if user is student
    if (!authLoading) {
      if (!user) {
        // Not authenticated, redirect to login
        window.location.href = "/login";
        return;
      }
      if (user.role !== "STUDENT") {
        // Wrong role, redirect to appropriate dashboard
        const redirectUrl = user.role === "ADMIN" ? "/admin" : "/login";
        window.location.href = redirectUrl;
        return;
      }
      //User is authenticated student,load dashboard data
      initializeDashboard();
    }
  }, [authLoading, user]);

  const initializeDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await studentApi.getDashboardData();
      setData(result);
    } catch (error) {
      setError("Failed to load dashboard data");
      console.error("Dashboard error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout(); // Use AuthContext logout method
  };

  const handleUpdateProfile = () => {
    // Navigate to profile page - implement based on your routing
    console.log("Navigate to profile update");
    // For now, just log. You can implement routing here
  };

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  //Show loading, while dashboard data is loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white rounded-lg shadow p-6 max-w-md">
            <div className="text-red-500 mb-4">
              <svg
                className="h-12 w-12 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Something went wrong
            </h3>
            <p className="text-red-600">{error}</p>
            <button
              onClick={initializeDashboard}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main dashboard render
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <DashboardHeader student={data.student} />
        <MembershipCard membership={data.membership} />
        <PaymentHistory payments={data.payments} />
        <QuickActions
          onLogout={handleLogout}
          onUpdateProfile={handleUpdateProfile}
        />
      </div>
    </div>
  );
};

export default StudentDashboard;
