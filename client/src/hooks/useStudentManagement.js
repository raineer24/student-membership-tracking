// File: client/src/hooks/useStudentManagement.js
// Lines 1-15: Enhanced imports and dependencies
import { useState, useCallback, useMemo } from 'react';
import { formatDueDate } from '../utils/dateUtils';
import { calculatePricingBreakdown } from '../utils/studentPricingUtils';

/**
 * useStudentManagement Hook
 * Manages student filtering, status calculations, and business logic
 * Extracted from DashboardPage.jsx lines 170-200, 280-320, 325-355
 * 
 * @param {Array} students - Array of student data
 * @returns {Object} Student management state and operations
 */
export const useStudentManagement = (students = []) => {
  // Lines 15-25: Filter and search state
  const [currentTab, setCurrentTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);

  // Lines 30-65: Student status logic (extracted from DashboardPage lines 170-200)
  const getStudentStatus = useCallback((student) => {
    if (!student?.memberships || student.memberships.length === 0) {
      return "inactive";
    }

    // Enhanced membership validation
    const latestMembership = student.memberships.reduce((latest, current) => {
      if (!current?.endDate) return latest;
      const currentEndDate = new Date(current.endDate);
      const latestEndDate = new Date(latest?.endDate || 0);
      return currentEndDate > latestEndDate ? current : latest;
    }, null);

    if (!latestMembership?.endDate) return "inactive";

    // Status determination with enhanced logic
    const endDate = new Date(latestMembership.endDate);
    const today = new Date();
    const daysDiff = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

    if (daysDiff < 0) return "overdue";
    if (daysDiff <= 7) return "expiring";
    return "active";
  }, []);

  // Lines 70-85: Reminder eligibility check
  const canSendReminder = useCallback((student) => {
    if (!student?.phone) return false;
    const status = getStudentStatus(student);
    return status === "expiring" || status === "overdue";
  }, [getStudentStatus]);

  // Lines 90-120: Enhanced student filtering (extracted from DashboardPage lines 280-320)
  const filteredStudents = useMemo(() => {
    let filtered = students;

    // Search functionality
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(student => 
        student.name?.toLowerCase().includes(query) ||
        student.email?.toLowerCase().includes(query) ||
        student.phone?.includes(query)
      );
    }

    // Tab-based filtering
    if (currentTab !== "all") {
      filtered = filtered.filter(student => {
        const status = getStudentStatus(student);
        return status === currentTab;
      });
    }

    return filtered;
  }, [students, searchQuery, currentTab, getStudentStatus]);

  // Lines 125-140: Statistics calculations (extracted from DashboardPage lines 325-355)
  const tabCounts = useMemo(() => {
    const counts = { all: students.length, active: 0, expiring: 0, overdue: 0, inactive: 0 };
    
    students.forEach(student => {
      const status = getStudentStatus(student);
      counts[status] = (counts[status] || 0) + 1;
    });
    
    return counts;
  }, [students, getStudentStatus]);

  const pricingBreakdown = useMemo(() => {
    return calculatePricingBreakdown(students);
  }, [students]);

  // Lines 145-150: Return hook interface
  return {
    // Filter state
    currentTab,
    searchQuery,
    isSearchActive,
    
    // Computed data
    filteredStudents,
    tabCounts,
    pricingBreakdown,
    
    // Operations
    getStudentStatus,
    canSendReminder,
    setCurrentTab,
    setSearchQuery,
    setIsSearchActive
  };
};