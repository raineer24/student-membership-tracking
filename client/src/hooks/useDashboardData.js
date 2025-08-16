// File: client/src/hooks/useDashboardData.js
// Lines 1-85: Data fetching and state management hook
// Extracted from DashboardPage.jsx lines 524-554 + 751-797
import { useState, useCallback, useEffect } from 'react';
import { adminApi } from '../services/adminApi';
import { useToast } from './useToast';

/**
 * Custom hook for dashboard data management
 * Handles API calls, loading states, and error handling
 * 
 * @param {string} token - Authentication token
 * @returns {Object} Dashboard data and operations
 */
export const useDashboardData = (token) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const { showError } = useToast();

  // Lines 20-45: Main data fetching function
  const fetchDashboardData = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      const [dashboard, studentsData] = await Promise.all([
        adminApi.getDashboardData(),
        adminApi.getAllStudents()
      ]);

      setDashboardData(dashboard);
      setStudents(studentsData);

    } catch (error) {
      console.error("Dashboard fetch error:", error);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [token, showError]);

  // Lines 50-70: Student update function
  const updateStudent = useCallback(async (studentId, updatedData) => {
    try {
      setIsSaving(true);
      await adminApi.updateStudent(studentId, updatedData);
      
      // Update local state optimistically
      setStudents(prev => 
        prev.map(student => 
          student.id === studentId 
            ? { ...student, ...updatedData }
            : student
        )
      );
      
      return true;
    } catch (error) {
      console.error("Update student error:", error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Lines 75-85: Effect hooks
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    dashboardData,
    students,
    loading,
    error,
    isSaving,
    updateStudent,
    refetch: fetchDashboardData
  };
};