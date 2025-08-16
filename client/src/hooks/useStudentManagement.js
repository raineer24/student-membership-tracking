// File: client/src/hooks/useStudentManagement.js
// Lines 1-15: Enhanced student management hook with fixed return object
// Extracted from DashboardPage.jsx lines 170-200, 280-320, 325-355
import { useState, useMemo, useCallback } from 'react';
import { calculatePricingBreakdown } from '../utils/studentPricingUtils';
import { isOverdue, getDaysUntilDate } from '../utils/dateUtils';

/**
 * Enhanced useStudentManagement Hook
 * Manages student filtering, status calculations, and business logic
 * Follows SOLID principles with single responsibility for student management
 * 
 * Features:
 * - Advanced student status calculation
 * - Real-time filtering and search
 * - Tab-based categorization
 * - Revenue and pricing calculations
 * - Reminder eligibility checking
 * 
 * @param {Array} students - Array of student data
 * @returns {Object} Student management state and operations
 */
export const useStudentManagement = (students = []) => {
  // Lines 20-30: Core state management
  const [currentTab, setCurrentTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);

  // Lines 35-75: Enhanced student status logic
  const getStudentStatus = useCallback((student) => {
    // Handle edge cases for missing or invalid student data
    if (!student?.memberships || !Array.isArray(student.memberships) || student.memberships.length === 0) {
      return "inactive";
    }

    // Find the most recent membership with enhanced validation
    const latestMembership = student.memberships.reduce((latest, current) => {
      if (!current?.endDate) return latest;
      
      const currentEndDate = new Date(current.endDate);
      const latestEndDate = latest?.endDate ? new Date(latest.endDate) : new Date(0);
      
      // Validate dates before comparison
      if (isNaN(currentEndDate.getTime())) return latest;
      if (isNaN(latestEndDate.getTime())) return current;
      
      return currentEndDate > latestEndDate ? current : latest;
    }, null);

    // If no valid membership found, student is inactive
    if (!latestMembership?.endDate) {
      return "inactive";
    }

    // Enhanced status determination with better edge case handling
    const endDate = latestMembership.endDate;
    
    // Check if overdue
    if (isOverdue(endDate)) {
      return "overdue";
    }
    
    // Check if expiring soon (within 7 days)
    const daysUntilDue = getDaysUntilDate(endDate);
    if (daysUntilDue !== null && daysUntilDue <= 7 && daysUntilDue >= 0) {
      return "expiring";
    }
    
    // Active membership
    return "active";
  }, []);

  // Lines 80-95: SMS reminder eligibility with enhanced validation
  const canSendReminder = useCallback((student) => {
    // Check if student has valid phone number
    if (!student?.phoneNumber && !student?.phone) {
      return false;
    }
    
    // Check if phone number is valid (basic validation)
    const phoneNumber = student.phoneNumber || student.phone;
    if (typeof phoneNumber !== 'string' || phoneNumber.trim().length === 0) {
      return false;
    }
    
    // Only allow reminders for students who need attention
    const status = getStudentStatus(student);
    return status === "expiring" || status === "overdue";
  }, [getStudentStatus]);

  // Lines 100-140: Enhanced filtering with performance optimization
  const filteredStudents = useMemo(() => {
    if (!Array.isArray(students) || students.length === 0) {
      return [];
    }

    let filtered = students;

    // Apply search filter first (more selective)
    if (isSearchActive && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      
      filtered = filtered.filter(student => {
        // Multiple search fields with null safety
        const name = (student.name || '').toLowerCase();
        const email = (student.email || '').toLowerCase();
        const phoneNumber = (student.phoneNumber || student.phone || '').toLowerCase();
        
        return name.includes(query) || 
               email.includes(query) || 
               phoneNumber.includes(query);
      });
    }

    // Apply tab filter
    if (currentTab !== "all") {
      filtered = filtered.filter(student => {
        const status = getStudentStatus(student);
        return status === currentTab;
      });
    }

    // Sort by status priority and then by name
    return filtered.sort((a, b) => {
      const statusPriority = { overdue: 0, expiring: 1, active: 2, inactive: 3 };
      const statusA = getStudentStatus(a);
      const statusB = getStudentStatus(b);
      
      const priorityDiff = statusPriority[statusA] - statusPriority[statusB];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Secondary sort by name
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [students, searchQuery, isSearchActive, currentTab, getStudentStatus]);

  // Lines 145-170: Enhanced tab counts with performance optimization
  const tabCounts = useMemo(() => {
    if (!Array.isArray(students) || students.length === 0) {
      return {
        all: 0,
        active: 0,
        expiring: 0,
        overdue: 0,
        inactive: 0
      };
    }

    // Calculate counts in a single pass for better performance
    const counts = students.reduce((acc, student) => {
      const status = getStudentStatus(student);
      acc[status] = (acc[status] || 0) + 1;
      acc.all += 1;
      return acc;
    }, {
      all: 0,
      active: 0,
      expiring: 0,
      overdue: 0,
      inactive: 0
    });

    return counts;
  }, [students, getStudentStatus]);

  // Lines 175-185: Enhanced pricing breakdown with memoization
  const pricingBreakdown = useMemo(() => {
    if (!Array.isArray(students) || students.length === 0) {
      return {
        total: 0,
        totalMonthly: 0,
        averageRate: 0,
        legacy: 0,
        current: 0,
        legacyRevenue: 0,
        currentRevenue: 0
      };
    }

    return calculatePricingBreakdown(students);
  }, [students]);

  // Lines 190-220: Search management utilities
  const handleSearchChange = useCallback((query) => {
    setSearchQuery(query);
    setIsSearchActive(query.trim().length > 0);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setIsSearchActive(false);
  }, []);

  const handleTabChange = useCallback((tab) => {
    setCurrentTab(tab);
  }, []);

  // Lines 225-245: Student statistics for dashboard
  const studentStats = useMemo(() => {
    const total = students.length;
    const needsAttention = (tabCounts.expiring || 0) + (tabCounts.overdue || 0);
    const attentionPercentage = total > 0 ? Math.round((needsAttention / total) * 100) : 0;
    
    return {
      total,
      needsAttention,
      attentionPercentage,
      activePercentage: total > 0 ? Math.round(((tabCounts.active || 0) / total) * 100) : 0,
      overduePercentage: total > 0 ? Math.round(((tabCounts.overdue || 0) / total) * 100) : 0
    };
  }, [students.length, tabCounts]);

  // Lines 250-265: Utility functions for external use
  const getStudentsByStatus = useCallback((status) => {
    return students.filter(student => getStudentStatus(student) === status);
  }, [students, getStudentStatus]);

  const getStudentsNeedingReminders = useCallback(() => {
    return students.filter(student => canSendReminder(student));
  }, [students, canSendReminder]);

  const isStudentEligibleForAction = useCallback((student, action) => {
    switch (action) {
      case 'reminder':
        return canSendReminder(student);
      case 'payment':
        return ['expiring', 'overdue'].includes(getStudentStatus(student));
      case 'edit':
        return true; // All students can be edited
      case 'view':
        return true; // All students can be viewed
      default:
        return false;
    }
  }, [canSendReminder, getStudentStatus]);

  // Lines 270-285: COMPLETELY FIXED return object - NO duplicates
  return {
    // Core filter state
    currentTab,
    searchQuery,
    isSearchActive,
    
    // Computed data
    filteredStudents,
    tabCounts,
    pricingBreakdown,
    studentStats,
    
    // Status functions
    getStudentStatus,
    canSendReminder,
    isStudentEligibleForAction,
    
    // Filter operations
    setCurrentTab: handleTabChange,
    setSearchQuery: handleSearchChange,
    setIsSearchActive,
    clearSearch,
    
    // Utility functions
    getStudentsByStatus,
    getStudentsNeedingReminders
  };
};