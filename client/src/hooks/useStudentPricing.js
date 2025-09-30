// File: client/src/hooks/useStudentPricing.js
// Lines 1-80: Custom hook for fetching and managing student-specific pricing
// Extracted from PaymentModal.jsx (Lines 63-126)
// Handles grandfathered pricing tiers and fallback to standard rates

import { useState, useEffect } from "react";

/**
 * useStudentPricing Hook
 * Line 10-15: Fetches student-specific pricing with grandfathered tier support
 * Automatically loads pricing when modal opens with a student
 * Provides fallback to standard pricing if API fails
 * 
 * @param {string|null} studentId - ID of student to fetch pricing for
 * @param {string} token - JWT authentication token
 * @param {boolean} isOpen - Whether modal is open (triggers fetch)
 * @returns {Object} Pricing state and utilities
 */
const useStudentPricing = (studentId, token, isOpen) => {
  // Line 20-25: State management for pricing data
  const [studentPricing, setStudentPricing] = useState(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingError, setPricingError] = useState(null);

  /**
   * Fetches pricing from API endpoint
   * Line 30-75: API call with comprehensive error handling
   * Implements fallback to standard pricing on failure
   */
  const fetchStudentPricing = async (studentId) => {
    if (!studentId || !token) return;
    
    try {
      setPricingLoading(true);
      setPricingError(null);
      
      const response = await fetch(`/api/payments/pricing/${studentId}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.pricing) {
        setStudentPricing(data.pricing);
      }
    } catch (error) {
      console.error("Failed to fetch pricing:", error);
      setPricingError("Failed to load pricing");
      
      // Line 60-66: Fallback to standard pricing on error
      setStudentPricing({
        monthly: 1400,
        yearly: 16800,
        tier: "Standard (fallback)",
        isLegacy: false
      });
    } finally {
      setPricingLoading(false);
    }
  };

  /**
   * Effect: Auto-fetch pricing when modal opens with student
   * Line 75-85: Clears pricing when modal closes
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
   * Line 92-98: Returns standard prices if no pricing loaded yet
   */
  const getMembershipPrices = () => {
    if (!studentPricing) {
      return { MONTHLY: 1400, YEARLY: 16800 };
    }
    return { MONTHLY: studentPricing.monthly, YEARLY: studentPricing.yearly };
  };

  // Line 102-110: Return all pricing state and utilities
  return {
    studentPricing,
    pricingLoading,
    pricingError,
    getMembershipPrices,
    refetchPricing: () => fetchStudentPricing(studentId)
  };
};

export default useStudentPricing;