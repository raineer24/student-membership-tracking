// Line 1-15: Complete PaymentModal.jsx - Enhanced with robust error handling and date management
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

const PaymentModal = ({
  isOpen,
  onClose,
  student = null,
  onPaymentSuccess,
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Line 15-25: Enhanced form state with comprehensive payment options
  const [formData, setFormData] = useState({
    amount: "",
    method: "CASH",
    description: "",
    extendMembership: true,
    membershipType: "MONTHLY",
    paymentDateOption: "today",
    customPaymentDate: "",
  });

  // Line 30-40: Payment methods with emojis for better UX
  const paymentMethods = [
    { value: "CASH", label: "💵 Cash" },
    { value: "CARD", label: "💳 Card" },
    { value: "BANK_TRANSFER", label: "🏦 Bank Transfer" },
    { value: "ONLINE", label: "🌐 Online Payment" },
    { value: "CHECK", label: "📝 Check" },
    { value: "OTHER", label: "📋 Other" },
  ];

  // Line 45-50: Membership pricing constants
  const membershipPrices = {
    MONTHLY: 1400,
    YEARLY: 16800,
  };

  // Line 55-65: Enhanced date formatting function with timezone handling
  const formatDate = (date) => {
    const localDate = new Date(date);
    // Ensure we're working with local timezone
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Line 70-95: Enhanced display date function with relative dates
  const getDisplayDate = (dateString) => {
    if (!dateString) return "";

    // Parse date without time to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const todayStr = formatDate(today);
    const yesterdayStr = formatDate(yesterday);
    const inputStr = dateString;

    if (inputStr === todayStr) return "Today";
    if (inputStr === yesterdayStr) return "Yesterday";

    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    });
  };

  // Line 100-105: Date range helpers for validation
  const getMaxDate = () => {
    return formatDate(new Date());
  };

  const getMinDate = () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return formatDate(thirtyDaysAgo);
  };

  // Line 110-130: Preview dates calculation for membership extension
  const getPreviewDates = () => {
    let baseDate = new Date();
    
    if (formData.paymentDateOption === "custom" && formData.customPaymentDate) {
      // Parse date string properly without timezone conversion
      const [year, month, day] = formData.customPaymentDate.split('-').map(Number);
      baseDate = new Date(year, month - 1, day); // month is 0-indexed
    }

    const endDate = new Date(baseDate);
    if (formData.membershipType === "MONTHLY") {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    return {
      startDate: formatDate(baseDate),
      endDate: formatDate(endDate),
    };
  };

  // Line 135-150: Enhanced input change handler with error clearing
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear relevant errors when user starts typing
    if (error) {
      if (name === "amount" && error.includes("amount")) {
        setError(null);
      }
      if (name === "customPaymentDate" && error.includes("date")) {
        setError(null);
      }
    }
  };

  // Line 155-170: Enhanced membership type change handler
  const handleMembershipTypeChange = (type) => {
    setFormData((prev) => ({
      ...prev,
      membershipType: type,
      amount: membershipPrices[type].toString(),
    }));

    // Clear amount-related errors since we're setting a valid amount
    if (error && error.includes("amount")) {
      setError(null);
    }
  };

  // Line 175-190: Enhanced payment date option change handler
  const handlePaymentDateOptionsChange = (option) => {
    setFormData((prev) => ({
      ...prev,
      paymentDateOption: option,
      // If switching to custom, default to today; if switching to today, clear custom date
      customPaymentDate: option === "today" ? "" : formatDate(new Date()),
    }));

    if (error && error.includes("date")) {
      setError(null);
    }
  };

  // Line 195-205: Enhanced custom date change handler
  const handleCustomDateChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      customPaymentDate: e.target.value,
    }));

    // Clear date-related errors
    if (error && error.includes("date")) {
      setError(null);
    }
  };

  // Line 210-270: Enhanced form validation with comprehensive checks
  const validateForm = () => {
    if (!student) {
      setError("No student selected");
      return false;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError("Please enter a valid amount");
      return false;
    }

    if (isNaN(parseFloat(formData.amount))) {
      setError("Amount must be a valid number");
      return false;
    }

    // Validate membership amounts if extending membership
    if (formData.extendMembership) {
      const requiredAmount = membershipPrices[formData.membershipType];
      const enteredAmount = parseFloat(formData.amount);
      if (enteredAmount !== requiredAmount) {
        setError(
          `${formData.membershipType} membership must be exactly ₱${requiredAmount.toLocaleString()}`
        );
        return false;
      }
    }

    // Enhanced payment date validation with proper timezone handling
    if (formData.paymentDateOption === "custom") {
      if (!formData.customPaymentDate) {
        setError("Please select a payment date");
        return false;
      }

      // Enhanced client-side date validation with consistent timezone handling
      const [year, month, day] = formData.customPaymentDate.split('-').map(Number);
      const selectedDate = new Date(year, month - 1, day);
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Normalize times for accurate comparison
      today.setHours(23, 59, 59, 999);
      thirtyDaysAgo.setHours(0, 0, 0, 0);
      selectedDate.setHours(12, 0, 0, 0); // Set to noon for comparison

      if (selectedDate > today) {
        setError("Payment date cannot be in the future");
        return false;
      }

      if (selectedDate < thirtyDaysAgo) {
        setError("Payment date cannot be more than 30 days ago");
        return false;
      }
    }

    return true;
  };

  // Line 275-345: Enhanced submit handler with comprehensive error handling
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Enhanced payment date determination - send date string instead of ISO timestamp
      let paymentDateToSend = null;

      if (formData.paymentDateOption === "custom" && formData.customPaymentDate) {
        // Send date as string to avoid timezone conversion issues
        paymentDateToSend = formData.customPaymentDate; // Send as "2025-07-05"
        console.log("📅 Using custom payment date:", paymentDateToSend);
      } else {
        // For 'today' option, don't send paymentDate (backend will use current timestamp)
        console.log("📅 Using current timestamp (today option)");
      }

      const paymentData = {
        studentId: student.id,
        amount: parseFloat(formData.amount),
        method: formData.method,
        description:
          formData.description ||
          `${formData.membershipType} membership payment`,
        extendMembership: formData.extendMembership,
        membershipType: formData.membershipType,
        // Conditionally include paymentDate as date string
        ...(paymentDateToSend && { paymentDate: paymentDateToSend }),
      };

      console.log("Sending payment data:", paymentData);

      const response = await fetch("/api/payments/create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      });

      const responseData = await response.json();
      console.log("API Response:", responseData);

      if (!response.ok) {
        throw new Error(
          responseData.error || `Payment failed: ${response.status}`
        );
      }

      // SUCCESS HANDLING WITH ENHANCED FEEDBACK
      const successMsg = paymentDateToSend
        ? `Payment recorded for ${getDisplayDate(formData.customPaymentDate)}`
        : "Payment recorded successfully";

      setSuccessMessage(successMsg);
      console.log("Payment successful:", responseData);

      // Line 335-345: Enhanced callback with more detailed information
      if (typeof onPaymentSuccess === 'function') {
        onPaymentSuccess({
          payment: responseData,
          student: student,
          membershipExtended: formData.extendMembership,
          amount: parseFloat(formData.amount),
          method: formData.method,
          customDate: paymentDateToSend ? formData.customPaymentDate : null,
          paymentDate: responseData.paymentDate,
        });
      }
      
      // Small delay to show success message before closing
      setTimeout(() => {
        handleClose();
      }, 1000);
    } catch (error) {
      console.error("Payment error:", error);
      setError(error.message || "Payment processing failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Line 350-365: Enhanced form reset function
  const resetForm = () => {
    setFormData({
      amount: "",
      method: "CASH",
      description: "",
      extendMembership: true,
      membershipType: "MONTHLY",
      paymentDateOption: "today",
      customPaymentDate: "",
    });
    setError(null);
    setSuccessMessage(null);
  };

  // Line 370-380: Safe close handler with prop validation
  const handleClose = () => {
    resetForm();
    
    // Safe function call with validation to prevent runtime errors
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  // Line 385-400: Handle escape key to close modal with enhanced event handling
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !loading) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, loading]);

  // Early return if modal is not open - performance optimization
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Line 410-425: Enhanced header with accessibility */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            💳 Record Payment
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 p-1"
            type="button"
            aria-label="Close modal"
            disabled={loading}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Line 430-445: Enhanced student info display */}
        {student && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-blue-600">👤</span>
              <p className="font-medium text-blue-900">{student.name}</p>
            </div>
            <p className="text-sm text-blue-700 ml-6">{student.email}</p>
            {student.phone && (
              <p className="text-sm text-blue-700 ml-6">📱 {student.phone}</p>
            )}
          </div>
        )}

        {/* Line 450-465: Success message display */}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-green-600">✅</span>
              <p className="text-green-800 text-sm font-medium">
                {successMessage}
              </p>
            </div>
          </div>
        )}

        {/* Line 470-485: Enhanced error message display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-red-600">❌</span>
              <p className="text-red-800 text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Line 490-750: Enhanced main form with comprehensive payment options */}
        <div className="space-y-4">
          {/* Payment date selection section */}
          <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
            <label className="block text-sm font-medium text-gray-700 mb-3">📅 Payment Date</label>

            <div className="space-y-3">
              {/* Today Option */}
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="paymentDateOption"
                  value="today"
                  checked={formData.paymentDateOption === "today"}
                  onChange={(e) =>
                    handlePaymentDateOptionsChange(e.target.value)
                  }
                  className="text-blue-600 focus:ring-blue-500"
                  disabled={loading}
                />
                <span className="text-sm font-medium">
                  Today ({new Date().toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short", 
                    day: "numeric"
                  })})
                </span>
              </label>
              
              {/* Custom Date Option */}
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="paymentDateOption"
                  value="custom"
                  checked={formData.paymentDateOption === "custom"}
                  onChange={(e) =>
                    handlePaymentDateOptionsChange(e.target.value)
                  }
                  className="text-blue-600 focus:ring-blue-500"
                  disabled={loading}
                />
                <span className="text-sm font-medium">Different Date</span>
              </label>

              {/* Line 530-570: Custom Date Picker (Conditional) */}
              {formData.paymentDateOption === "custom" && (
                <div className="ml-6">
                  <input
                    type="date"
                    value={formData.customPaymentDate}
                    onChange={handleCustomDateChange}
                    min={getMinDate()}
                    max={getMaxDate()}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    aria-label="Select custom payment date"
                  />

                  {/* Date Preview */}
                  {formData.customPaymentDate && (
                     <div className="text-xs text-gray-600 bg-white p-2 rounded border mt-2">
                      <div className="flex items-center space-x-1 mb-1">
                        <span>📅</span>
                        <span className="font-medium">Selected:</span>
                        <span>{getDisplayDate(formData.customPaymentDate)}</span>
                      </div>
                      {formData.extendMembership && (
                        <div className="flex items-center space-x-1">
                          <span>🎯</span>
                          <span className="font-medium">Membership:</span>
                          <span>{getDisplayDate(getPreviewDates().startDate)} → {getDisplayDate(getPreviewDates().endDate)}</span>
                        </div>
                      )}
                    </div>
                  )}
                   {/* Helper Text */}
                  <p className="text-xs text-gray-500 mt-1">
                    💡 You can select dates up to 30 days in the past
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Line 575-620: Quick Membership Buttons */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Select (Exact Amount)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleMembershipTypeChange("MONTHLY")}
                disabled={loading}
                className={`p-3 rounded-lg border text-sm transition-colors disabled:opacity-50 ${
                  formData.membershipType === "MONTHLY"
                    ? "bg-blue-50 border-blue-500 text-blue-700"
                    : "bg-white border-gray-300 hover:bg-gray-50"
                }`}
              >
                📅 Monthly
                <br />
                <span className="text-lg font-bold">
                  ₱{membershipPrices.MONTHLY.toLocaleString()}
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleMembershipTypeChange("YEARLY")}
                disabled={loading}
                className={`p-3 rounded-lg border text-sm transition-colors disabled:opacity-50 ${
                  formData.membershipType === "YEARLY"
                    ? "bg-blue-50 border-blue-500 text-blue-700"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                📅 Yearly
                <br />
                <span className="text-lg font-bold">
                  ₱{membershipPrices.YEARLY.toLocaleString()}
                </span>
              </button>
            </div>
          </div>

          {/* Line 625-645: Amount Input */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Amount (₱)
            </label>
            <input
              id="amount"
              type="number"
              name="amount"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={handleInputChange}
              disabled={loading}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              placeholder="Enter amount"
              aria-describedby="amount-help"
            />
            <p id="amount-help" className="text-xs text-gray-500 mt-1">
              Monthly: ₱{membershipPrices.MONTHLY.toLocaleString()} | Yearly:
              ₱{membershipPrices.YEARLY.toLocaleString()}
            </p>
          </div>

          {/* Line 650-670: Payment Method */}
          <div>
            <label
              htmlFor="method"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Payment Method
            </label>
            <select
              id="method"
              name="method"
              value={formData.method}
              onChange={handleInputChange}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            >
              {paymentMethods.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>

          {/* Line 675-695: Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description (Optional)
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="2"
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              placeholder="Payment description..."
            />
          </div>

          {/* Line 700-715: Extend Membership Checkbox */}
          <div>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                name="extendMembership"
                checked={formData.extendMembership}
                onChange={handleInputChange}
                disabled={loading}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                🎯 Extend Membership (
                {formData.membershipType === "MONTHLY"
                  ? "30 days"
                  : "365 days"}
                )
              </span>
            </label>
          </div>

          {/* Line 720-760: Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={
                loading ||
                !formData.amount ||
                parseFloat(formData.amount) <= 0
              }
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                "💳 Record Payment"
              )}
            </button>
          </div>
        </div>

        {/* Line 765-790: Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <svg
                className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-2"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
               <p className="text-sm text-gray-600">
                {formData.paymentDateOption === "custom" ? "Recording historical payment..." : "Processing payment..."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;