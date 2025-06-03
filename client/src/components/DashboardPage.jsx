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
  }

  if(loading) return <LoadingSpinner message="Loading dasboard..." />
  if(error) return <ErrorMessage message={error} onRetry={refreshData} />
  if(!dashboardData) return <ErrorMessage message='No dashboard data available ' />
  
  return (
    <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex justify-between items-center py-6">
                    <div>
                        <h1 className="text-3x1 font-bold text-gray-900">Admin Dashboard</h1>
                        <p className="text-gray-600 mt-1">Welcome back, {user?.email}</p>
                    </div>
                    <button className="bg-blue-600">refresh data</button>
                </div>
            </div>
        </header>
    </div>
  )
}
