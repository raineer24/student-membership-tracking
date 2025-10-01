// File: client/src/hooks/usePaymentSubmission.js
// Lines 1-140: Custom hook for payment submission with duplicate prevention
// Extracted from PaymentModal.jsx (Lines 106-203)
// Handles payment API calls, duplicate detection, and success callbacks

import { useState, useRef } from "react";

/**
 * usePaymentSubmission Hook
 * Line 10-18: Manages payment submission state and duplicate prevention
 * Uses ref-based tracking to prevent double submissions within 3 seconds
 * Handles success/error states and auto-closes modal on success
 * 
 * @param {string} token - JWT authentication token
 * @param {Function} onPaymentSuccess - Callback after successful payment
 * @param {Function} onClose - Function to close modal
 * @returns {Object} Submission state and submit function
 */
const usePaymentSubmission = (token, onPaymentSuccess, onClose) => {
  // Line 22-25: Submission state management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Line 28-29: Ref for duplicate detection - persists across renders
  const lastSubmissionRef = useRef(null);

  /**
   * Checks if submission is duplicate within 3-second window
   * Line 35-52: Compares studentId, amount, and method to detect duplicates
   * @param {Object} paymentData - Payment data to check
   * @returns {boolean} True if duplicate detected
   */
  const isDuplicateSubmission = (paymentData) => {
    if (!lastSubmissionRef.current) return false;
    
    const last = lastSubmissionRef.current;
    const now = Date.now();
    
    // Line 45-52: Check within 3-second window
    if (now - last.timestamp < 3000) {
      if (
        last.studentId === paymentData.studentId &&
        last.amount === paymentData.amount &&
        last.method === paymentData.method
      ) {
        console.warn("Duplicate submission blocked");
        return true;
      }
    }
    
    return false;
  };

  /**
   * Main payment submission function
   * Line 60-135: Handles complete payment flow with error handling
   * @param {Object} paymentData - Complete payment data object
   * @param {Object} student - Student receiving payment
   * @param {Object} studentPricing - Student's pricing tier data
   */
  const submitPayment = async (paymentData, student, studentPricing) => {
    // Line 67-70: Prevent concurrent submissions
    if (isSubmitting) {
      console.warn("Submission already in progress");
      return;
    }

    // Line 73-76: Initialize submission state
    setIsSubmitting(true);
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Line 81-85: Check for duplicate before API call
      if (isDuplicateSubmission(paymentData)) {
        setError("Duplicate payment detected. Please wait before submitting again.");
        return;
      }

      // Line 88-98: Make API call to create payment
      const response = await fetch("/api/payments/create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      });

      const responseData = await response.json();

      // Line 101-108: Handle API errors
      if (!response.ok) {
        if (response.status === 409) {
          throw new Error("Duplicate payment detected by server");
        }
        throw new Error(responseData.error || `Payment failed`);
      }

      // Line 111-117: Record successful submission for duplicate detection
      lastSubmissionRef.current = {
        timestamp: Date.now(),
        studentId: paymentData.studentId,
        amount: paymentData.amount,
        method: paymentData.method
      };

      // Line 120-122: Set success message
      setSuccessMessage("Payment recorded successfully");

      // Line 125-132: Trigger success callback with all relevant data
      if (typeof onPaymentSuccess === 'function') {
        onPaymentSuccess({
          payment: responseData,
          student: student,
          studentPricing: responseData.studentPricing || studentPricing
        });
      }
      
      // Line 135-138: Auto-close modal after 1.5 seconds
      setTimeout(() => {
        if (typeof onClose === 'function') {
          onClose();
        }
      }, 1500);

    } catch (error) {
      // Line 142-144: Handle and display errors
      console.error("Payment error:", error);
      setError(error.message || "Payment processing failed");
    } finally {
      // Line 147-152: Reset loading and submission states
      setLoading(false);
      setTimeout(() => {
        setIsSubmitting(false);
      }, 2000); // 2-second cooldown after submission
    }
  };

  /**
   * Reset function to clear all submission state
   * Line 160-167: Useful when modal closes or form resets
   */
  const reset = () => {
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(false);
    lastSubmissionRef.current = null;
  };

  // Line 170-180: Return all submission state and functions
  return {
    loading,
    error,
    successMessage,
    isSubmitting,
    submitPayment,
    reset,
    setError // Allow external error setting for validation
  };
};

export default usePaymentSubmission;