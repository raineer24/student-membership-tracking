// Line 1-20: FIXED Complete Enhanced PaymentModal with grandfathered pricing support
import { useEffect, useState, useCallback } from "react";
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
  
  // Line 15-25: Enhanced pricing state management
  const [studentPricing, setStudentPricing] = useState(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingError, setPricingError] = useState(null);

  // Line 25-35: Enhanced form state with all necessary fields
  const [formData, setFormData] = useState({
    amount: "",
    method: "CASH",
    description: "",
    extendMembership: true,
    membershipType: "MONTHLY",
    paymentDateOption: "today",
    customPaymentDate: "",
  });

  // Line 40-50: Payment methods with enhanced display
  const paymentMethods = [
    { value: "CASH", label: "💵 Cash" },
    { value: "CARD", label: "💳 Card" },
    { value: "BANK_TRANSFER", label: "🏦 Bank Transfer" },
    { value: "ONLINE", label: "🌐 Online Payment" },
    { value: "CHECK", label: "📝 Check" },
    { value: "OTHER", label: "📋 Other" },
  ];

  // Line 55-95: FIXED Enhanced pricing tier badge component
  const PricingTierBadge = ({ pricing }) => {
    if (!pricing) return null;
    
    const badgeConfigs = {
      "Founding Member": {
        bg: "bg-purple-100",
        text: "text-purple-800",
        border: "border-purple-300",
        emoji: "🌟",
        description: "₱1,000/month - Original member"
      },
      "Early Adopter": {
        bg: "bg-blue-100",
        text: "text-blue-800", 
        border: "border-blue-300",
        emoji: "🌟",
        description: "₱1,200/month - Early growth period"
      },
      "Legacy": {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        border: "border-yellow-300", 
        emoji: "🌟",
        description: "Custom rate - Grandfathered pricing"
      },
      "Standard": {
        bg: "bg-green-100",
        text: "text-green-800",
        border: "border-green-300",
        emoji: "",
        description: "₱1,400/month - Current rate"
      }
    };
    
    const config = badgeConfigs[pricing.tier] || badgeConfigs["Standard"];
    
    return (
      <div className="inline-flex items-center space-x-2">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${config.bg} ${config.text} ${config.border}`}>
          {config.emoji && <span className="mr-1">{config.emoji}</span>}
          {pricing.tier}
        </span>
        <span className="text-xs text-gray-500">{config.description}</span>
      </div>
    );
  };

  // Line 100-130: FIXED Enhanced dynamic pricing calculation with proper legacy support
  const getMembershipPrices = useCallback(() => {
    if (!studentPricing) {
      // Fallback to standard rates if pricing not loaded
      return {
        MONTHLY: 1400,
        YEARLY: 16800,
      };
    }
    
    // Use individual student pricing
    return {
      MONTHLY: studentPricing.monthly,
      YEARLY: studentPricing.yearly,
    };
  }, [studentPricing]);

  // Line 135-195: FIXED Enhanced student pricing fetcher with comprehensive error handling
  const fetchStudentPricing = useCallback(async (studentId) => {
    if (!studentId || !token) {
      console.warn("Cannot fetch pricing: missing studentId or token");
      return;
    }
    
    try {
      setPricingLoading(true);
      setPricingError(null);
      
      console.log(`🔍 Fetching pricing for student ID: ${studentId}`);
      
      const response = await fetch(`/api/payments/pricing/${studentId}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("💰 Pricing data received:", data);
      
      if (data.success && data.pricing) {
        setStudentPricing(data.pricing);
        
        // FIXED: Auto-set amount based on current membership type and student's actual rates
        const prices = {
          MONTHLY: data.pricing.monthly,
          YEARLY: data.pricing.yearly
        };
        
        setFormData(prev => ({
          ...prev,
          amount: prices[prev.membershipType].toString()
        }));
        
        console.log(`✅ Pricing set for ${data.pricing.tier}: Monthly ₱${data.pricing.monthly}, Yearly ₱${data.pricing.yearly}`);
      } else {
        throw new Error(data.error || "Invalid pricing response");
      }
    } catch (error) {
      console.error("❌ Failed to fetch student pricing:", error);
      setPricingError(`Failed to load pricing: ${error.message}`);
      
      // FIXED: Fallback with clear indication of fallback mode
      setStudentPricing({
        monthly: 1400,
        yearly: 16800,
        tier: "Standard (fallback)",
        isLegacy: false,
        monthlyFormatted: "₱1,400",
        yearlyFormatted: "₱16,800"
      });
      
      setFormData(prev => ({
        ...prev,
        amount: prev.membershipType === "YEARLY" ? "16800" : "1400"
      }));
    } finally {
      setPricingLoading(false);
    }
  }, [token]);

  // Line 200-215: Load pricing when student changes or modal opens
  useEffect(() => {
    if (isOpen && student?.id) {
      console.log("🚪 Modal opened for student:", student.name, "ID:", student.id);
      fetchStudentPricing(student.id);
    } else if (!isOpen) {
      // Reset pricing state when modal closes
      setStudentPricing(null);
      setPricingError(null);
    }
  }, [isOpen, student?.id, fetchStudentPricing]);

  // Line 220-245: FIXED Enhanced membership type change handler with pricing updates
  const handleMembershipTypeChange = useCallback((type) => {
    const membershipPrices = getMembershipPrices();
    
    setFormData((prev) => ({
      ...prev,
      membershipType: type,
      amount: membershipPrices[type].toString(),
    }));

    // Clear amount-related errors since we're setting a valid amount
    if (error && error.includes("amount")) {
      setError(null);
    }
    
    console.log(`🔄 Membership type changed to ${type}, amount set to ₱${membershipPrices[type].toLocaleString()}`);
  }, [getMembershipPrices, error]);

  // Line 250-320: FIXED Enhanced form validation with grandfathered pricing validation
  const validateForm = useCallback(() => {
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

    // FIXED: Enhanced membership amount validation with individual pricing
    if (formData.extendMembership && studentPricing) {
      const membershipPrices = getMembershipPrices();
      const requiredAmount = membershipPrices[formData.membershipType];
      const enteredAmount = parseFloat(formData.amount);
      
      if (enteredAmount !== requiredAmount) {
        const tierInfo = studentPricing.isLegacy ? ` (${studentPricing.tier} rate)` : "";
        setError(
          `${formData.membershipType} membership${tierInfo} must be exactly ${studentPricing.monthlyFormatted || `₱${membershipPrices.MONTHLY.toLocaleString()}`} (monthly) or ${studentPricing.yearlyFormatted || `₱${membershipPrices.YEARLY.toLocaleString()}`} (yearly). You entered ₱${enteredAmount.toLocaleString()}.`
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

      // Enhanced client-side date validation
      const [year, month, day] = formData.customPaymentDate.split('-').map(Number);
      const selectedDate = new Date(year, month - 1, day);
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Normalize times for accurate comparison
      today.setHours(23, 59, 59, 999);
      thirtyDaysAgo.setHours(0, 0, 0, 0);
      selectedDate.setHours(12, 0, 0, 0);

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
  }, [student, formData, studentPricing, getMembershipPrices]);

  // Line 325-415: FIXED Enhanced submit handler with comprehensive error handling
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Enhanced payment date determination
      let paymentDateToSend = null;
      if (formData.paymentDateOption === "custom" && formData.customPaymentDate) {
        paymentDateToSend = formData.customPaymentDate;
        console.log("📅 Using custom payment date:", paymentDateToSend);
      } else {
        console.log("📅 Using current timestamp (today option)");
      }

      // FIXED: Enhanced payment data with pricing context
      const tierContext = studentPricing?.isLegacy ? ` (${studentPricing.tier})` : '';
      const paymentData = {
        studentId: student.id,
        amount: parseFloat(formData.amount),
        method: formData.method,
        description: formData.description || `${formData.membershipType} membership payment${tierContext}`,
        extendMembership: formData.extendMembership,
        membershipType: formData.membershipType,
        // Conditionally include paymentDate as date string
        ...(paymentDateToSend && { paymentDate: paymentDateToSend }),
      };

      console.log("📤 Sending enhanced payment data:", paymentData);

      const response = await fetch("/api/payments/create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      });

      const responseData = await response.json();
      console.log("📥 API Response:", responseData);

      if (!response.ok) {
        // Enhanced error handling with pricing context
        if (responseData.studentPricing) {
          console.log("🚫 Server pricing validation failed:", responseData.studentPricing);
        }
        throw new Error(responseData.error || `Payment failed: ${response.status}`);
      }

      // FIXED: Enhanced success handling with pricing context
      const pricingContext = responseData.studentPricing?.tier ? ` at ${responseData.studentPricing.tier} rate` : '';
      const successMsg = paymentDateToSend
        ? `Payment recorded for ${getDisplayDate(formData.customPaymentDate)}${pricingContext}`
        : `Payment recorded successfully${pricingContext}`;

      setSuccessMessage(successMsg);
      console.log("✅ Payment successful with pricing context:", responseData);

      // FIXED: Enhanced callback with comprehensive information
      if (typeof onPaymentSuccess === 'function') {
        onPaymentSuccess({
          payment: responseData,
          student: student,
          studentPricing: responseData.studentPricing,
          membershipExtended: formData.extendMembership,
          amount: parseFloat(formData.amount),
          method: formData.method,
          customDate: paymentDateToSend ? formData.customPaymentDate : null,
          paymentDate: responseData.paymentDate,
        });
      }
      
      // Show success message before closing
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (error) {
      console.error("❌ Payment error:", error);
      setError(error.message || "Payment processing failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Line 420-435: Enhanced date formatting functions
  const formatDate = (date) => {
    const localDate = new Date(date);
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDisplayDate = (dateString) => {
    if (!dateString) return "";

    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const todayStr = formatDate(today);
    const yesterdayStr = formatDate(yesterday);

    if (dateString === todayStr) return "Today";
    if (dateString === yesterdayStr) return "Yesterday";

    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    });
  };

  // Line 440-450: Date range helpers for validation
  const getMaxDate = () => formatDate(new Date());
  const getMinDate = () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return formatDate(thirtyDaysAgo);
  };

  // Line 455-485: Preview dates calculation for membership extension
  const getPreviewDates = () => {
    let baseDate = new Date();
    
    if (formData.paymentDateOption === "custom" && formData.customPaymentDate) {
      const [year, month, day] = formData.customPaymentDate.split('-').map(Number);
      baseDate = new Date(year, month - 1, day);
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

  // Line 490-510: Enhanced input change handler with error clearing
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

  // Line 515-530: Enhanced payment date option handlers
  const handlePaymentDateOptionsChange = (option) => {
    setFormData((prev) => ({
      ...prev,
      paymentDateOption: option,
      customPaymentDate: option === "today" ? "" : formatDate(new Date()),
    }));

    if (error && error.includes("date")) {
      setError(null);
    }
  };

  const handleCustomDateChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      customPaymentDate: e.target.value,
    }));

    if (error && error.includes("date")) {
      setError(null);
    }
  };

  // Line 535-555: Enhanced form reset function
  const resetForm = useCallback(() => {
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
    setStudentPricing(null);
    setPricingError(null);
  }, []);

  // Line 560-570: Safe close handler with cleanup
  const handleClose = useCallback(() => {
    resetForm();
    if (typeof onClose === 'function') {
      onClose();
    }
  }, [resetForm, onClose]);

  // Line 575-585: Enhanced escape key handler
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
  }, [isOpen, loading, handleClose]);

  // Early return if modal is not open
  if (!isOpen) return null;

  const membershipPrices = getMembershipPrices();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto shadow-xl relative">
        {/* Line 595-625: FIXED Enhanced header with pricing tier and loading states */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">💳 Record Payment</h2>
            {pricingLoading && (
              <div className="mt-1 flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span className="text-sm text-blue-600">Loading pricing...</span>
              </div>
            )}
            {studentPricing && !pricingLoading && (
              <div className="mt-2">
                <PricingTierBadge pricing={studentPricing} />
              </div>
            )}
            {pricingError && (
              <div className="mt-1 text-sm text-orange-600">
                ⚠️ {pricingError}
              </div>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 p-1"
            type="button"
            aria-label="Close modal"
            disabled={loading}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Line 630-680: FIXED Enhanced student info with comprehensive pricing display */}
        {student && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2">
                <span className="text-blue-600">👤</span>
                <p className="font-medium text-blue-900">{student.name}</p>
              </div>
            </div>
            <p className="text-sm text-blue-700 ml-6">{student.email}</p>
            {student.phone && (
              <p className="text-sm text-blue-700 ml-6">📱 {student.phone}</p>
            )}
            
            {/* FIXED: Enhanced individual pricing display */}
            {studentPricing && !pricingLoading && (
              <div className="mt-3 ml-6 p-3 bg-white rounded border">
                <p className="text-sm font-medium text-gray-700 mb-2">💰 Individual Rates</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="text-center p-2 bg-blue-50 rounded">
                    <div className="font-semibold text-blue-900">
                      {studentPricing.monthlyFormatted || `₱${studentPricing.monthly?.toLocaleString()}`}
                    </div>
                    <div className="text-xs text-blue-600">Monthly</div>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded">
                    <div className="font-semibold text-green-900">
                      {studentPricing.yearlyFormatted || `₱${studentPricing.yearly?.toLocaleString()}`}
                    </div>
                    <div className="text-xs text-green-600">Yearly</div>
                  </div>
                </div>
                {studentPricing.isLegacy && (
                  <div className="mt-2 flex items-center space-x-1">
                    <span className="text-purple-600">🌟</span>
                    <p className="text-xs text-purple-600 font-medium">Grandfathered pricing preserved</p>
                  </div>
                )}
                {!studentPricing.isLegacy && (
                  <p className="text-xs text-gray-500 mt-2">💡 Yearly saves ₱{((studentPricing.monthly * 12) - studentPricing.yearly).toLocaleString()}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Line 685-710: Enhanced success and error message display */}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-green-600">✅</span>
              <p className="text-green-800 text-sm font-medium">{successMessage}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-red-600">❌</span>
              <p className="text-red-800 text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Line 715-810: FIXED Enhanced main form with comprehensive payment options */}
        <div className="space-y-4">
          {/* FIXED: Enhanced quick membership buttons with individual pricing display */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Select {studentPricing ? `(${studentPricing.tier} Rates)` : '(Loading...)'}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleMembershipTypeChange("MONTHLY")}
                disabled={loading || pricingLoading}
                className={`p-4 rounded-lg border text-sm transition-colors disabled:opacity-50 ${
                  formData.membershipType === "MONTHLY"
                    ? "bg-blue-50 border-blue-500 text-blue-700"
                    : "bg-white border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="text-center">
                  <div className="text-lg mb-1">📅</div>
                  <div className="font-medium">Monthly</div>
                  <div className="text-lg font-bold">
                    {studentPricing?.monthlyFormatted || `₱${membershipPrices.MONTHLY.toLocaleString()}`}
                  </div>
                  {studentPricing?.isLegacy && (
                    <div className="text-xs text-purple-600 mt-1">🌟 Legacy Rate</div>
                  )}
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleMembershipTypeChange("YEARLY")}
                disabled={loading || pricingLoading}
                className={`p-4 rounded-lg border text-sm transition-colors disabled:opacity-50 ${
                  formData.membershipType === "YEARLY"
                    ? "bg-blue-50 border-blue-500 text-blue-700"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <div className="text-center">
                  <div className="text-lg mb-1">📅</div>
                  <div className="font-medium">Yearly</div>
                  <div className="text-lg font-bold">
                    {studentPricing?.yearlyFormatted || `₱${membershipPrices.YEARLY.toLocaleString()}`}
                  </div>
                  {studentPricing?.isLegacy && (
                    <div className="text-xs text-purple-600 mt-1">🌟 Legacy Rate</div>
                  )}
                  {studentPricing && !studentPricing.isLegacy && (
                    <div className="text-xs text-green-600 mt-1">
                      Save ₱{((studentPricing.monthly * 12) - studentPricing.yearly).toLocaleString()}
                    </div>
                  )}
                </div>
              </button>
            </div>
            
            {/* FIXED: Enhanced pricing helper text with tier-specific information */}
            {studentPricing && (
              <div className="mt-3 p-3 bg-gray-50 rounded text-sm text-gray-600">
                <div className="flex items-center space-x-1 mb-2">
                  <span>💡</span>
                  <span className="font-medium">Pricing Information</span>
                </div>
                <div className="space-y-1 text-xs">
                  <p>• Student has <strong>{studentPricing.tier}</strong> pricing tier</p>
                  {studentPricing.isLegacy && (
                    <p>• Legacy rates are preserved from original enrollment</p>
                  )}
                  <p>• Monthly: {studentPricing.monthlyFormatted || `₱${studentPricing.monthly?.toLocaleString()}`} | Yearly: {studentPricing.yearlyFormatted || `₱${studentPricing.yearly?.toLocaleString()}`}</p>
                  {!studentPricing.isLegacy && (
                    <p>• Yearly membership saves ₱{((studentPricing.monthly * 12) - studentPricing.yearly).toLocaleString()} compared to 12 monthly payments</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Line 815-845: Enhanced amount input with comprehensive validation messaging */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Payment Amount (₱)
            </label>
            <input
              id="amount"
              type="number"
              name="amount"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={handleInputChange}
              disabled={loading || pricingLoading}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              placeholder="Enter payment amount"
              aria-describedby="amount-help"
            />
            <p id="amount-help" className="text-xs text-gray-500 mt-1">
              {studentPricing ? (
                `${studentPricing.tier} rates: ${studentPricing.monthlyFormatted || `₱${studentPricing.monthly?.toLocaleString()}`} monthly | ${studentPricing.yearlyFormatted || `₱${studentPricing.yearly?.toLocaleString()}`} yearly`
              ) : pricingLoading ? (
                "Loading individual rates..."
              ) : (
                "Standard rates: ₱1,400 monthly | ₱16,800 yearly"
              )}
            </p>
          </div>

          {/* Line 850-870: Payment method selection */}
          <div>
            <label htmlFor="method" className="block text-sm font-medium text-gray-700 mb-1">
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

          {/* Line 875-895: Description field */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
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

          {/* Line 900-925: FIXED Enhanced extend membership checkbox with pricing context */}
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
                🎯 Extend Membership ({formData.membershipType === "MONTHLY" ? "30 days" : "365 days"})
                {studentPricing?.isLegacy && (
                  <span className="text-purple-600 text-xs ml-2">🌟 at {studentPricing.tier} rate</span>
                )}
              </span>
            </label>
            {formData.extendMembership && studentPricing && (
              <div className="ml-6 mt-1 text-xs text-gray-600">
                Membership will be extended for {formData.membershipType === "MONTHLY" ? "30 days" : "365 days"} at {studentPricing.tier} pricing
              </div>
            )}
          </div>

          {/* Line 930-1030: Enhanced payment date selection with preview */}
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
                  onChange={(e) => handlePaymentDateOptionsChange(e.target.value)}
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
                  onChange={(e) => handlePaymentDateOptionsChange(e.target.value)}
                  className="text-blue-600 focus:ring-blue-500"
                  disabled={loading}
                />
                <span className="text-sm font-medium">Different Date</span>
              </label>

              {/* Custom Date Picker */}
              {formData.paymentDateOption === "custom" && (
                <div className="ml-6 space-y-3">
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

                  {/* Enhanced Date Preview with Membership Extension Info */}
                  {formData.customPaymentDate && (
                    <div className="text-xs text-gray-600 bg-white p-3 rounded border space-y-2">
                      <div className="flex items-center space-x-1">
                        <span>📅</span>
                        <span className="font-medium">Selected Date:</span>
                        <span className="text-blue-600 font-semibold">{getDisplayDate(formData.customPaymentDate)}</span>
                      </div>
                      
                      {formData.extendMembership && studentPricing && (
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1">
                            <span>🎯</span>
                            <span className="font-medium">Membership Extension:</span>
                          </div>
                          <div className="ml-4 space-y-1">
                            <div>Start: {getDisplayDate(getPreviewDates().startDate)}</div>
                            <div>End: {getDisplayDate(getPreviewDates().endDate)}</div>
                            <div className="text-purple-600">
                              {studentPricing.isLegacy && "🌟 "}Duration: {formData.membershipType === "MONTHLY" ? "30 days" : "365 days"}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Helper Text */}
                  <p className="text-xs text-gray-500">
                    💡 You can select dates up to 30 days in the past
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Line 1035-1070: Enhanced action buttons */}
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
                pricingLoading || 
                !formData.amount || 
                parseFloat(formData.amount) <= 0 ||
                (formData.extendMembership && !studentPricing)
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
              ) : pricingLoading ? (
                "Loading Rates..."
              ) : (
                "💳 Record Payment"
              )}
            </button>
          </div>

          {/* Line 1075-1110: FIXED Enhanced pricing summary (if pricing loaded) */}
          {studentPricing && !pricingLoading && formData.extendMembership && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">📋 Payment Summary</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Student:</span>
                  <span className="font-medium">{student?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pricing Tier:</span>
                  <span className="font-medium">
                    {studentPricing.isLegacy && "🌟 "}{studentPricing.tier}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Membership Type:</span>
                  <span className="font-medium">{formData.membershipType}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span className="font-medium text-green-600">
                    ₱{parseFloat(formData.amount || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Extension:</span>
                  <span className="font-medium">
                    {formData.membershipType === "MONTHLY" ? "30 days" : "365 days"}
                  </span>
                </div>
                {formData.paymentDateOption === "custom" && formData.customPaymentDate && (
                  <div className="flex justify-between">
                    <span>Payment Date:</span>
                    <span className="font-medium">{getDisplayDate(formData.customPaymentDate)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Line 1115-1145: FIXED Enhanced loading overlay with context-specific messages */}
        {(loading || pricingLoading) && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <svg
                className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-3"
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
              <p className="text-sm text-gray-600 font-medium">
                {pricingLoading ? (
                  "Loading student pricing rates..."
                ) : loading ? (
                  formData.paymentDateOption === "custom" ? 
                    "Recording historical payment..." : 
                    studentPricing?.isLegacy ? 
                      `Processing payment at ${studentPricing.tier} rate...` :
                      "Processing payment..."
                ) : (
                  "Please wait..."
                )}
              </p>
              {studentPricing?.isLegacy && loading && (
                <p className="text-xs text-purple-600 mt-1">
                  🌟 Applying grandfathered pricing
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;