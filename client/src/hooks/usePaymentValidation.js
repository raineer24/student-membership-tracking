// File: client/src/hooks/usePaymentValidation.js
// Updated: January 8, 2026 - Validate ₱1,500 standard rate
// Simplified: Removed legacy pricing logic

const STANDARD_MONTHLY = 1500;
const STANDARD_YEARLY = 18000;

/**
 * usePaymentValidation Hook
 * Line 10: Validates payment form with ₱1,500 standard pricing
 */
const usePaymentValidation = (formData, student, studentPricing) => {
  
  /**
   * validateForm Function
   * Line 16: Main validation logic
   */
  const validateForm = (setError) => {
    // Student selection validation
    if (!student) {
      setError("No student selected");
      return false;
    }

    // Amount validation - must be positive number
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError("Please enter a valid amount");
      return false;
    }

    // Membership pricing validation - exact amounts required
    if (formData.extendMembership) {
      const requiredAmount = formData.membershipType === "YEARLY" ? STANDARD_YEARLY : STANDARD_MONTHLY;
      const enteredAmount = parseFloat(formData.amount);
      
      if (enteredAmount !== requiredAmount) {
        setError(
          `${formData.membershipType} membership must be exactly ₱${requiredAmount.toLocaleString()}`
        );
        return false;
      }
    }

    // Custom date validation (if not today)
    if (formData.paymentDateOption === "custom") {
      if (!formData.customPaymentDate) {
        setError("Please select a payment date");
        return false;
      }

      // Parse date components for accurate timezone-independent validation
      const [year, month, day] = formData.customPaymentDate.split('-').map(Number);
      const selectedDate = new Date(year, month - 1, day);
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Normalize times for date-only comparison
      today.setHours(23, 59, 59, 999);
      thirtyDaysAgo.setHours(0, 0, 0, 0);
      selectedDate.setHours(12, 0, 0, 0);

      // Future date validation
      if (selectedDate > today) {
        setError("Payment date cannot be in the future");
        return false;
      }

      // Past date validation (max 30 days ago)
      if (selectedDate < thirtyDaysAgo) {
        setError("Payment date cannot be more than 30 days ago");
        return false;
      }
    }

    // All validations passed
    return true;
  };

  return { validateForm };
};

export default usePaymentValidation;