// File: client/src/hooks/useStudentOperations.js  
// Lines 1-100: Complete student CRUD operations extraction
// Clear line guidance: Centralize all student data operations with error handling

import { useCallback } from "react";

/**
 * Manages all student-related operations (CRUD + business logic)
 * Follows Single Responsibility Principle - handles only student operations
 * Preserves ALL existing student operation functionality from DashboardPage
 * @param {string} token - Authentication token
 * @param {Function} showSuccess - Success toast notification function
 * @param {Function} showError - Error toast notification function  
 * @param {Function} fetchStudents - Data refresh callback function
 * @returns {Object} Student operation handlers
 */
const useStudentOperations = (token, showSuccess, showError, fetchStudents) => {
  
  // Lines 17-42: Add student operation (extracted from DashboardPage handleAddStudent)
  const handleAddStudent = useCallback(async (studentData) => {
    try {
      const response = await fetch("/api/students", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(studentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add student");
      }

      const result = await response.json();
      showSuccess(`Student ${result.name} added successfully!`);
      await fetchStudents(); // Refresh data
      return result;
    } catch (error) {
      showError(`Failed to add student: ${error.message}`);
      throw error;
    }
  }, [token, showSuccess, showError, fetchStudents]);

  // Lines 44-78: Save/update student operation (extracted from DashboardPage handleSaveStudent)
  const handleSaveStudent = useCallback(async (updatedStudentData) => {
    // Input validation (preserving existing validation logic)
    if (!updatedStudentData || !updatedStudentData.id) {
      showError("Invalid student data for update");
      return;
    }

    try {
      const response = await fetch(`/api/students/${updatedStudentData.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: updatedStudentData.name,
          email: updatedStudentData.email,
          phone: updatedStudentData.phone,
          age: updatedStudentData.age,
          parent: updatedStudentData.parent,
          monthlyRate: parseFloat(updatedStudentData.monthlyRate || 1400),
          isLegacyStudent: Boolean(updatedStudentData.isLegacyStudent)
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
      }

      const result = await response.json();
      showSuccess(`Student ${updatedStudentData.name} updated successfully!`);
      await fetchStudents(); // Refresh data
      return result;
    } catch (error) {
      showError(`Failed to update student: ${error.message}`);
      throw error;
    }
  }, [token, showSuccess, showError, fetchStudents]);

  // Lines 80-90: View student operation (extracted from DashboardPage handleViewStudent)
  const handleViewStudent = useCallback((studentId, students) => {
    if (!studentId) {
      return null;
    }
    
    const student = students.find(s => s && s.id === studentId);
    if (!student) {
      showError("Student not found");
      return null;
    }
    return student;
  }, [showError]);

  // Lines 92-100: Training operation validation (extracted from DashboardPage handleLogTraining)
  const handleLogTraining = useCallback((student) => {
    if (!student || typeof student !== 'object') {
      showError("Invalid student data");
      return null;
    }
    return student; // Return student for further processing
  }, [showError]);

  // Lines 102-110: Return all student operations interface
  return {
    handleAddStudent,
    handleSaveStudent,
    handleViewStudent,
    handleLogTraining
  };
};

export default useStudentOperations;