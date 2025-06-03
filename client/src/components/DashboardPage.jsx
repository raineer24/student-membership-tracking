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
  });

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
  }

  if(loading) return <LoadingSpinner message="Loading dasboard..." />
  if(error) return <ErrorMessage message={error} onRetry={refreshData} />
  if(!dashboardData) return <ErrorMessage message='No dashboard data available ' />
  
  return (
    <div className="min-h-screen">
        {/* Header */}
        <header>
            <div className="max-w-7xl">
                <div className="flex">
                    <div>
                        <h1 className="text-3x1">Admin Dashboard</h1>
                        <p className="text-gray-600">Welcome back, {user?.email}</p>
                    </div>
                </div>
            </div>
        </header>
    </div>
  )
}
