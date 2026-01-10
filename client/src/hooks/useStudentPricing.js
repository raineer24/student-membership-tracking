// File: client/src/hooks/useStudentPricing.js
// Updated: January 8, 2026 - All students ₱1,500 standard rate
// Simplified: Removed legacy pricing logic

import { useState, useEffect } from "react";

const STANDARD_MONTHLY = 1500;
const STANDARD_YEARLY = 18000;

/**
 * useStudentPricing Hook
 * Line 11: Returns standard ₱1,500 pricing for all students
 */
const useStudentPricing = (studentId, token, isOpen) => {
  const [studentPricing, setStudentPricing] = useState(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingError, setPricingError] = useState(null);

  /**
   * Fetches pricing from API endpoint
   * Line 22: Simplified - just returns standard pricing
   */
  const fetchStudentPricing = async (studentId) => {
    if (!studentId || !token) return;
    
    setPricingLoading(true);
    setPricingError(null);
    
    // All students have standard pricing now
    setStudentPricing({
      monthly: STANDARD_MONTHLY,
      yearly: STANDARD_YEARLY,
      tier: "Standard",
      isLegacy: false
    });
    
    setPricingLoading(false);
  };

  /**
   * Effect: Auto-fetch pricing when modal opens with student
   * Line 43: Clears pricing when modal closes
   */
  useEffect(() => {
    if (isOpen && studentId) {
      fetchStudentPricing(studentId);
    } else if (!isOpen) {
      setStudentPricing(null);
      setPricingError(null);
    }
  }, [isOpen, studentId]);

  /**
   * Helper: Get membership prices based on student's tier
   * Line 56: Returns standard ₱1,500 prices
   */
  const getMembershipPrices = () => {
    return { 
      MONTHLY: STANDARD_MONTHLY, 
      YEARLY: STANDARD_YEARLY 
    };
  };

  // Line 65: Return all pricing state and utilities
  return {
    studentPricing,
    pricingLoading,
    pricingError,
    getMembershipPrices,
    refetchPricing: () => fetchStudentPricing(studentId)
  };
};

export default useStudentPricing;