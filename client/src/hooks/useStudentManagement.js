// File: client/src/hooks/useStudentManagement.js
// Lines 1-15: Enhanced imports and dependencies - CLEAN VERSION
import { useState, useMemo } from 'react';

/**
 * useStudentManagement Hook
 * Manages student filtering, status calculations, and business logic
 * 
 * CRITICAL FIXES APPLIED:
 * - Fixed membership selection to use LATEST membership instead of first
 * - Enhanced search functionality with proper state management
 * - Improved date calculations with timezone handling
 * - Removed all console logging for production
 * 
 * @param {Array} students - Array of student data from API
 * @returns {Object} Student management state and operations
 */
export default function useStudentManagement(students = []) {
  // Lines 15-20: State management for filtering and search
  const [currentTab, setCurrentTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);

  // Lines 25-85: CRITICAL FIX - Student status calculation with proper membership sorting
  const getStudentStatus = (student) => {
    if (!student?.memberships || student.memberships.length === 0) {
      return "inactive";
    }

    // FIXED: Sort memberships by creation date DESC to get the LATEST membership
    // This fixes the bug where students with multiple memberships showed expired status
    const sortedMemberships = [...student.memberships].sort((a, b) => {
      // Use createdAt if available, fallback to endDate for sorting
      const dateA = new Date(a.createdAt || a.endDate || a.startDate);
      const dateB = new Date(b.createdAt || b.endDate || b.startDate);
      return dateB - dateA; // DESC order - newest first
    });

    const latestMembership = sortedMemberships[0];
    
    if (!latestMembership?.endDate) {
      return "inactive";
    }

    // FIXED: Proper date comparison without timezone issues
    const endDate = new Date(latestMembership.endDate);
    const today = new Date();
    
    // Strip time components for accurate day-level comparison
    const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const diffTime = endDateOnly - todayOnly;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Status determination logic
    if (diffDays < 0) {
      return "overdue";
    }
    if (diffDays <= 7) {
      return "expiring";
    }
    
    return "active";
  };

  // Lines 90-125: FIXED search filtering functionality
  const filteredStudents = useMemo(() => {
    if (!Array.isArray(students)) return [];
    
    let result = [...students];
    
    // Apply search filter properly when search is active
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(student => {
        const name = String(student.name || '').toLowerCase();
        const email = String(student.email || '').toLowerCase();
        const phone = String(student.phone || student.phoneNumber || '').toLowerCase();
        
        return name.includes(query) || 
               email.includes(query) || 
               phone.includes(query);
      });
    }
    
    // Apply tab filter after search
    if (currentTab !== "all") {
      result = result.filter(student => {
        const status = getStudentStatus(student);
        return status === currentTab;
      });
    }
    
    return result;
  }, [students, searchQuery, currentTab]); // FIXED: Added proper dependencies

  // Lines 130-150: Enhanced tab counts calculation
  const tabCounts = useMemo(() => {
    const counts = {
      all: students.length,
      active: 0,
      expiring: 0,
      overdue: 0,
      inactive: 0
    };

    students.forEach(student => {
      const status = getStudentStatus(student);
      counts[status] = (counts[status] || 0) + 1;
    });

    return counts;
  }, [students]);

  // Lines 155-200: FIXED pricing breakdown calculation - CLEAN VERSION
  const pricingBreakdown = useMemo(() => {
    if (!Array.isArray(students) || students.length === 0) {
      return {
        totalMonthly: 0,
        totalYearly: 0,
        activePaidStudents: 0,
        founding: 0,
        early: 0,
        standard: 0,
        foundingRevenue: 0,
        earlyRevenue: 0,
        standardRevenue: 0,
        currency: "₱"
      };
    }

    let totalMonthly = 0;
    let activePaidStudents = 0;
    let founding = 0, early = 0, standard = 0;
    let foundingRevenue = 0, earlyRevenue = 0, standardRevenue = 0;
    
    students.forEach(student => {
      // CRITICAL FIX: Count ALL students with COMPLETED payments (active, expiring, overdue)
      const status = getStudentStatus(student);
      const hasPaid = student.payments && student.payments.length > 0 && 
                     student.payments.some(payment => payment.status === 'COMPLETED');
      
      // Business Logic: Revenue includes all paying students regardless of membership status
      const isPayingStudent = hasPaid && (status === 'active' || status === 'expiring' || status === 'overdue');
      
      // Only exclude students who haven't paid or are completely inactive
      if (!isPayingStudent) {
        return;
      }

      const monthlyRate = student.monthlyRate || 1400;
      totalMonthly += monthlyRate;
      activePaidStudents++;

      // Categorize by rate to match expected breakdown: ₱1000 Founding, ₱1200 Early, ₱1400+ Standard
      if (monthlyRate === 1000) {
        founding++;
        foundingRevenue += monthlyRate;
      } else if (monthlyRate === 1200) {
        early++;
        earlyRevenue += monthlyRate;
      } else {
        standard++;
        standardRevenue += monthlyRate;
      }
    });

    return {
      totalMonthly,
      totalYearly: totalMonthly * 12,
      activePaidStudents,
      founding,
      early, 
      standard,
      foundingRevenue,
      earlyRevenue,
      standardRevenue,
      currency: "₱"
    };
  }, [students]);

  // Lines 205-220: Enhanced search state management
  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setIsSearchActive(value.trim().length > 0);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setIsSearchActive(false);
  };

  // Lines 225-240: Helper function for reminder eligibility
  const canSendReminder = (student) => {
    const status = getStudentStatus(student);
    const hasPhone = Boolean(student.phone || student.phoneNumber);
    return (status === "expiring" || status === "overdue") && hasPhone;
  };

  // Lines 245-290: Days remaining calculation for UI display
  const getDaysRemaining = (student) => {
    if (!student?.memberships || student.memberships.length === 0) {
      return "No membership";
    }

    // Use same logic as getStudentStatus for consistency
    const sortedMemberships = [...student.memberships].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.endDate || a.startDate);
      const dateB = new Date(b.createdAt || b.endDate || b.startDate);
      return dateB - dateA;
    });

    const latestMembership = sortedMemberships[0];
    
    if (!latestMembership?.endDate) return "No end date";

    const endDate = new Date(latestMembership.endDate);
    const today = new Date();
    const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diffDays = Math.ceil((endDateOnly - todayOnly) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `Expired ${Math.abs(diffDays)} days ago`;
    if (diffDays === 0) return "Expires today";
    return `${diffDays} days remaining`;
  };

  // Lines 295-315: Return hook interface with all functionality
  return {
    // Filter state
    currentTab,
    searchQuery,
    isSearchActive,
    
    // Computed data
    filteredStudents,
    tabCounts,
    pricingBreakdown,
    
    // Utility functions
    getStudentStatus,
    getDaysRemaining,
    canSendReminder,
    
    // State setters
    setCurrentTab,
    setSearchQuery: handleSearchChange,
    setIsSearchActive,
    clearSearch
  };
}