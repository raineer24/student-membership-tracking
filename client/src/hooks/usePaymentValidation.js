// File: client/src/hooks/usePaymentValidation.js
// Lines 1-90: Custom hook for payment form validation logic
// Extracted from PaymentModal.jsx (Lines 143-200)
// Centralizes all validation rules in one testable location

/**
 * usePaymentValidation Hook
 * Line 10-15: Validates payment form inputs with comprehensive business rules
 * Enforces exact pricing for membership extensions
 * Validates date ranges (30 days ago to today)
 * 
 * @param {Object} formData - Current form state
 * @param {Object} student - Student being paid for
 * @param {Object} studentPricing - Student's pricing tier data
 * @returns {Object} Validation function and error state
 */
const usePaymentValidation = (formData, student, studentPricing) => {
  
  /**
   * validateForm Function
   * Line 25-85: Main validation logic with detailed error messages
   * Returns true if valid, sets error message if invalid
   */
  const validateForm = (setError) => {
    // Line 30-33: Student selection validation
    if (!student) {
      setError("No student selected");
      return false;
    }

    // Line 36-40: Amount validation - must be positive number
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError("Please enter a valid amount");
      return false;
    }

    // Line 43-55: Membership pricing validation
    // If extending membership, amount must match exact tier price
    if (formData.extendMembership && studentPricing) {
      const prices = {
        MONTHLY: studentPricing.monthly || 1400,
        YEARLY: studentPricing.yearly || 16800
      };
      const requiredAmount = prices[formData.membershipType];
      const enteredAmount = parseFloat(formData.amount);
      
      if (enteredAmount !== requiredAmount) {
        setError(
          `${formData.membershipType} membership must be exactly ₱${requiredAmount.toLocaleString()}`
        );
        return false;
      }
    }

    // Line 58-85: Custom date validation (if not today)
    if (formData.paymentDateOption === "custom") {
      if (!formData.customPaymentDate) {
        setError("Please select a payment date");
        return false;
      }

      // Line 65-70: Parse date components for accurate timezone-independent validation
      const [year, month, day] = formData.customPaymentDate.split('-').map(Number);
      const selectedDate = new Date(year, month - 1, day);
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Line 73-76: Normalize times for date-only comparison
      today.setHours(23, 59, 59, 999);
      thirtyDaysAgo.setHours(0, 0, 0, 0);
      selectedDate.setHours(12, 0, 0, 0);

      // Line 79-83: Future date validation
      if (selectedDate > today) {
        setError("Payment date cannot be in the future");
        return false;
      }

      // Line 86-90: Past date validation (max 30 days ago)
      if (selectedDate < thirtyDaysAgo) {
        setError("Payment date cannot be more than 30 days ago");
        return false;
      }
    }

    // Line 95: All validations passed
    return true;
  };

  return { validateForm };
};

export default usePaymentValidation;