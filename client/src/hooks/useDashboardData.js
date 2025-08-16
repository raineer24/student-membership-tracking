// File: client/src/hooks/useDashboardData.js
// Lines 1-15: Enhanced imports and dependencies
import { useState, useCallback, useEffect } from 'react';
import { adminApi } from '../services/adminApi';
import { useToast } from './useToast';
import { useAuth } from '../context/AuthContext';

/**
 * useDashboardData Hook
 * Manages dashboard data fetching, student management, and error handling
 * Extracted from DashboardPage.jsx lines 95-140, 245-275, 325-355
 * 
 * @param {string} token - Authentication token
 * @returns {Object} Dashboard data state and operations
 */
export const useDashboardData = (token) => {
  // Lines 15-25: Core state management (extracted from DashboardPage lines 40-50)
  const [dashboardData, setDashboardData] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const { logout } = useAuth();
  const { showSuccess, showError } = useToast();

  // Lines 30-75: Enhanced data fetching (extracted from DashboardPage lines 95-140)
  const fetchDashboardData = useCallback(async () => {
    if (!token) {
      setError("Authentication token missing");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log("🔄 Fetching dashboard data using enhanced API...");

      // Parallel API calls for better performance
      const [dashboardResponse, studentsResponse] = await Promise.all([
        adminApi.getDashboardData(),
        adminApi.getAllStudents()
      ]);

      // Enhanced data validation
      if (dashboardResponse && studentsResponse) {
        setDashboardData(dashboardResponse);
        setStudents(Array.isArray(studentsResponse) ? studentsResponse : []);
        console.log("✅ Dashboard data fetched successfully");
      } else {
        throw new Error("Invalid response data structure");
      }

    } catch (error) {
      console.error("❌ Dashboard data fetch error:", error);
      
      // Enhanced error handling with specific messages
      if (error.response?.status === 401) {
        setError("Session expired. Please log in again.");
        logout();
      } else if (error.response?.status === 403) {
        setError("Access denied. Admin privileges required.");
      } else {
        setError(`Failed to load dashboard: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, [token, logout, showError]);

  // Lines 80-120: Student management operations (extracted from DashboardPage lines 245-275)
  const updateStudent = useCallback(async (studentId, updatedData) => {
    if (isSaving) return null;

    try {
      setIsSaving(true);
      console.log("🔄 Updating student:", studentId);
      
      const response = await adminApi.updateStudent(studentId, updatedData);
      
      if (response && response.id) {
        // Update local state with new data
        setStudents(prevStudents => 
          prevStudents.map(s => s.id === studentId ? { ...s, ...response } : s)
        );
        
        console.log("✅ Student updated successfully");
        showSuccess(`Student updated successfully!`);
        return response;
      }
      
    } catch (error) {
      console.error("❌ Student update error:", error);
      showError(`Failed to update student: ${error.message}`);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, showSuccess, showError]);

  // Lines 125-140: Effect hooks and initialization
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    if (error) {
      showError(error);
    }
  }, [error, showError]);

  // Lines 145-165: Return hook interface
  return {
    // Data state
    dashboardData,
    students,
    loading,
    error,
    isSaving,
    
    // Operations
    setStudents,
    fetchDashboardData,
    updateStudent,
    refetch: fetchDashboardData
  };
};