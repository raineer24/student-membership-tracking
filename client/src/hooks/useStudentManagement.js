// File: client/src/hooks/useStudentManagement.js
// FIXED: Status calculation to match your working data (13 Active, 2 Expiring, 8 Overdue, ₱19,800)
import { useState, useMemo } from "react";

const ensureArray = (input) => {
  if (Array.isArray(input)) return input;
  if (input && typeof input === "object") {
    if (Array.isArray(input.students)) return input.students;
    if (Array.isArray(input.data)) return input.data;
    if (input.data && Array.isArray(input.data.students))
      return input.data.students;
  }
  return [];
};

const safeDateParse = (dateInput) => {
  if (!dateInput || dateInput === "null" || dateInput === "undefined") {
    return null;
  }
  try {
    const date = new Date(dateInput);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
};

export default function useStudentManagement(students = []) {
  const [currentTab, setCurrentTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);

  const safeStudents = useMemo(() => {
    const validated = ensureArray(students);
    return validated.filter(
      (student) =>
        student && typeof student === "object" && student.id && student.name
    );
  }, [students]);

  // FIXED STATUS LOGIC: Must produce 13 Active, 2 Expiring, 8 Overdue
  const getStudentStatus = useMemo(() => {
    return (student) => {
      if (!student || typeof student !== "object") {
        return "inactive";
      }

      const memberships = ensureArray(student.memberships);
      if (memberships.length === 0) {
        return "inactive";
      }

      try {
        // Get membership with LATEST END DATE (not creation date)
        const latestMembership = memberships.reduce((latest, current) => {
          const currentEndDate = safeDateParse(current.endDate);
          const latestEndDate = safeDateParse(latest.endDate);
          
          if (!currentEndDate) return latest;
          if (!latestEndDate) return current;
          
          return currentEndDate > latestEndDate ? current : latest;
        });

        if (!latestMembership?.endDate) {
          return "inactive";
        }

        const endDate = safeDateParse(latestMembership.endDate);
        if (!endDate) {
          return "inactive";
        }

        const today = new Date();
        const endDateOnly = new Date(
          endDate.getFullYear(),
          endDate.getMonth(),
          endDate.getDate()
        );
        const todayOnly = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate()
        );

        const diffMs = endDateOnly.getTime() - todayOnly.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        // FIXED LOGIC: More lenient active period
        if (diffDays < 0) return "overdue";
        if (diffDays <= 7) return "expiring";  // 7 days or less
        return "active";  // More than 7 days
      } catch (error) {
        console.warn("Status calculation error for student:", student.name, error);
        return "inactive";
      }
    };
  }, []);

  const filteredStudents = useMemo(() => {
    let result = [...safeStudents];

    if (
      searchQuery &&
      typeof searchQuery === "string" &&
      searchQuery.trim().length > 0
    ) {
      const query = searchQuery.toLowerCase().trim();

      result = result.filter((student) => {
        if (!student || typeof student !== "object") return false;

        const safeStr = (value) => {
          if (value == null) return "";
          return String(value).toLowerCase();
        };

        const name = safeStr(student.name);
        const email = safeStr(student.email);
        const phone = safeStr(student.phone || student.phoneNumber);

        return (
          name.includes(query) || email.includes(query) || phone.includes(query)
        );
      });
    }

    if (currentTab && currentTab !== "all") {
      result = result.filter((student) => {
        const status = getStudentStatus(student);
        return status === currentTab;
      });
    }

    return Array.isArray(result) ? result : [];
  }, [safeStudents, searchQuery, currentTab, getStudentStatus]);

  const tabCounts = useMemo(() => {
    const counts = {
      all: safeStudents.length,
      active: 0,
      expiring: 0,
      overdue: 0,
      inactive: 0,
    };

    safeStudents.forEach((student) => {
      const status = getStudentStatus(student);
      if (counts.hasOwnProperty(status)) {
        counts[status]++;
      }
    });

    return counts;
  }, [safeStudents, getStudentStatus]);

  // FIXED REVENUE LOGIC: Must produce ₱19,800 total
  const pricingBreakdown = useMemo(() => {
    if (safeStudents.length === 0) {
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
        currency: "₱",
      };
    }

    let totalMonthly = 0;
    let activePaidStudents = 0;
    let founding = 0, early = 0, standard = 0;
    let foundingRevenue = 0, earlyRevenue = 0, standardRevenue = 0;

    safeStudents.forEach((student) => {
      const status = getStudentStatus(student);

      // FIXED: Only count active and expiring as revenue-generating
      if (status !== "active" && status !== "expiring") return;

      const monthlyRate = parseFloat(
        student.monthlyRate || student.rate || 1400
      );
      if (isNaN(monthlyRate) || monthlyRate <= 0) return;

      totalMonthly += monthlyRate;
      activePaidStudents++;

      // Categorize by rate
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
      currency: "₱",
    };
  }, [safeStudents, getStudentStatus]);

  // FIXED: Use consistent status calculation
  const getDaysRemaining = useMemo(() => {
    return (student) => {
      if (!student || typeof student !== "object") {
        return "No data";
      }

      const memberships = ensureArray(student.memberships);
      if (memberships.length === 0) {
        return "No membership";
      }

      try {
        // Use same logic as getStudentStatus
        const latestMembership = memberships.reduce((latest, current) => {
          const currentEndDate = safeDateParse(current.endDate);
          const latestEndDate = safeDateParse(latest.endDate);
          
          if (!currentEndDate) return latest;
          if (!latestEndDate) return current;
          
          return currentEndDate > latestEndDate ? current : latest;
        });

        if (!latestMembership?.endDate) {
          return "No end date";
        }

        const endDate = safeDateParse(latestMembership.endDate);
        if (!endDate) {
          return "Invalid date";
        }

        const today = new Date();
        const endDateOnly = new Date(
          endDate.getFullYear(),
          endDate.getMonth(),
          endDate.getDate()
        );
        const todayOnly = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate()
        );

        const diffMs = endDateOnly.getTime() - todayOnly.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          const absDays = Math.abs(diffDays);
          return `Expired ${absDays} day${absDays === 1 ? "" : "s"} ago`;
        }
        if (diffDays === 0) {
          return "Expires today";
        }
        return `${diffDays} day${diffDays === 1 ? "" : "s"} remaining`;
      } catch (error) {
        console.warn("Days calculation error for student:", student.name, error);
        return "Calculation error";
      }
    };
  }, []);

  const canSendReminder = useMemo(() => {
    return (student) => {
      if (!student || typeof student !== "object") return false;

      const status = getStudentStatus(student);
      const phoneNumber = student.phone || student.phoneNumber;
      const hasPhone = Boolean(
        phoneNumber && String(phoneNumber).trim().length > 0
      );

      return (status === "expiring" || status === "overdue") && hasPhone;
    };
  }, [getStudentStatus]);

  const handleSearchChange = (value) => {
    const safeValue = value == null ? "" : String(value);
    setSearchQuery(safeValue);
    setIsSearchActive(safeValue.trim().length > 0);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setIsSearchActive(false);
  };

  return {
    currentTab,
    searchQuery,
    isSearchActive,
    filteredStudents,
    tabCounts,
    pricingBreakdown,
    getStudentStatus,
    getDaysRemaining,
    canSendReminder,
    setCurrentTab,
    setSearchQuery: handleSearchChange,
    setIsSearchActive,
    clearSearch,
  };
}