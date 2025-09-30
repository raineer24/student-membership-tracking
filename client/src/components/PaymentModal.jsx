// File: client/src/components/PaymentModal.jsx
// PaymentModal with Grandfathered Pricing and Duplicate Prevention
import { useEffect, useState, useRef } from "react";
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
  
  // Pricing state
  const [studentPricing, setStudentPricing] = useState(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingError, setPricingError] = useState(null);
  
  // NEW: Submission tracking to prevent duplicates
  const [isSubmitting, setIsSubmitting] = useState(false);
  const lastSubmissionRef = useRef(null);

  const [formData, setFormData] = useState({
    amount: "",
    method: "CASH",
    description: "",
    extendMembership: true,
    membershipType: "MONTHLY",
    paymentDateOption: "today",
    customPaymentDate: "",
  });

  const paymentMethods = [
    { value: "CASH", label: "💵 Cash" },
    { value: "CARD", label: "💳 Card" },
    { value: "BANK_TRANSFER", label: "🏦 Bank Transfer" },
    { value: "ONLINE", label: "🌐 Online Payment" },
    { value: "CHECK", label: "📝 Check" },
    { value: "OTHER", label: "📋 Other" },
  ];

  // Pricing tier badge
  const PricingTierBadge = ({ pricing }) => {
    if (!pricing) return null;
    
    const configs = {
      "Founding Member": { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-300", emoji: "🌟" },
      "Early Adopter": { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-300", emoji: "🌟" },
      "Legacy": { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-300", emoji: "🌟" },
      "Standard": { bg: "bg-green-100", text: "text-green-800", border: "border-green-300", emoji: "" }
    };
    
    const config = configs[pricing.tier] || configs["Standard"];
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${config.bg} ${config.text} ${config.border}`}>
        {config.emoji && <span className="mr-1">{config.emoji}</span>}
        {pricing.tier}
      </span>
    );
  };

  // Get membership prices based on student pricing
  const getMembershipPrices = () => {
    if (!studentPricing) {
      return { MONTHLY: 1400, YEARLY: 16800 };
    }
    return { MONTHLY: studentPricing.monthly, YEARLY: studentPricing.yearly };
  };

  // Fetch student pricing
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
        
        const prices = {
          MONTHLY: data.pricing.monthly,
          YEARLY: data.pricing.yearly
        };
        
        setFormData(prev => ({
          ...prev,
          amount: prices[prev.membershipType].toString()
        }));
      }
    } catch (error) {
      console.error("Failed to fetch pricing:", error);
      setPricingError("Failed to load pricing");
      
      setStudentPricing({
        monthly: 1400,
        yearly: 16800,
        tier: "Standard (fallback)",
        isLegacy: false
      });
      
      setFormData(prev => ({
        ...prev,
        amount: prev.membershipType === "YEARLY" ? "16800" : "1400"
      }));
    } finally {
      setPricingLoading(false);
    }
  };

  // Load pricing when modal opens
  useEffect(() => {
    if (isOpen && student?.id) {
      fetchStudentPricing(student.id);
    } else if (!isOpen) {
      setStudentPricing(null);
      setPricingError(null);
    }
  }, [isOpen, student?.id]);

  // Handle membership type change
  const handleMembershipTypeChange = (type) => {
    const prices = getMembershipPrices();
    
    setFormData((prev) => ({
      ...prev,
      membershipType: type,
      amount: prices[type].toString(),
    }));

    if (error && error.includes("amount")) {
      setError(null);
    }
  };

  // Validate form
  const validateForm = () => {
    if (!student) {
      setError("No student selected");
      return false;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError("Please enter a valid amount");
      return false;
    }

    if (formData.extendMembership && studentPricing) {
      const prices = getMembershipPrices();
      const requiredAmount = prices[formData.membershipType];
      const enteredAmount = parseFloat(formData.amount);
      
      if (enteredAmount !== requiredAmount) {
        setError(
          `${formData.membershipType} membership must be exactly ₱${requiredAmount.toLocaleString()}`
        );
        return false;
      }
    }

    if (formData.paymentDateOption === "custom") {
      if (!formData.customPaymentDate) {
        setError("Please select a payment date");
        return false;
      }

      const [year, month, day] = formData.customPaymentDate.split('-').map(Number);
      const selectedDate = new Date(year, month - 1, day);
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

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
  };

  // NEW: Check for duplicate submission
  const isDuplicateSubmission = (paymentData) => {
    if (!lastSubmissionRef.current) return false;
    
    const last = lastSubmissionRef.current;
    const now = Date.now();
    
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

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    // NEW: Prevent double submissions
    if (isSubmitting) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      let paymentDateToSend = null;
      if (formData.paymentDateOption === "custom" && formData.customPaymentDate) {
        paymentDateToSend = formData.customPaymentDate;
      }

      const tierContext = studentPricing?.isLegacy ? ` (${studentPricing.tier})` : '';
      const paymentData = {
        studentId: student.id,
        amount: parseFloat(formData.amount),
        method: formData.method,
        description: formData.description || `${formData.membershipType} membership payment${tierContext}`,
        extendMembership: formData.extendMembership,
        membershipType: formData.membershipType,
        ...(paymentDateToSend && { paymentDate: paymentDateToSend }),
      };

      // NEW: Check for duplicate
      if (isDuplicateSubmission(paymentData)) {
        setError("Duplicate payment detected. Please wait before submitting again.");
        return;
      }

      const response = await fetch("/api/payments/create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error("Duplicate payment detected by server");
        }
        throw new Error(responseData.error || `Payment failed`);
      }

      // NEW: Record submission
      lastSubmissionRef.current = {
        timestamp: Date.now(),
        studentId: paymentData.studentId,
        amount: paymentData.amount,
        method: paymentData.method
      };

      setSuccessMessage("Payment recorded successfully");

      if (typeof onPaymentSuccess === 'function') {
        onPaymentSuccess({
          payment: responseData,
          student: student,
          studentPricing: responseData.studentPricing
        });
      }
      
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (error) {
      console.error("Payment error:", error);
      setError(error.message || "Payment processing failed");
    } finally {
      setLoading(false);
      setTimeout(() => {
        setIsSubmitting(false);
      }, 2000);
    }
  };

  // Date helpers
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

    const todayStr = formatDate(today);
    if (dateString === todayStr) return "Today";

    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const getMaxDate = () => formatDate(new Date());
  const getMinDate = () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return formatDate(thirtyDaysAgo);
  };

  // Input handlers
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (error) {
      setError(null);
    }
  };

  const handlePaymentDateOptionsChange = (option) => {
    setFormData((prev) => ({
      ...prev,
      paymentDateOption: option,
      customPaymentDate: option === "today" ? "" : formatDate(new Date()),
    }));

    if (error) {
      setError(null);
    }
  };

  const handleCustomDateChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      customPaymentDate: e.target.value,
    }));

    if (error) {
      setError(null);
    }
  };

  // Reset and close
  const handleClose = () => {
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
    setIsSubmitting(false);
    lastSubmissionRef.current = null;
    onClose();
  };

  // Escape key handler
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

  if (!isOpen) return null;

  const membershipPrices = getMembershipPrices();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto shadow-xl relative">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">💳 Record Payment</h2>
            {pricingLoading && (
              <div className="mt-1 text-sm text-blue-600">Loading pricing...</div>
            )}
            {studentPricing && !pricingLoading && (
              <div className="mt-2">
                <PricingTierBadge pricing={studentPricing} />
              </div>
            )}
            {pricingError && (
              <div className="mt-1 text-sm text-orange-600">{pricingError}</div>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading || isSubmitting}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Student info */}
        {student && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-2 mb-1">
              <span>👤</span>
              <p className="font-medium text-blue-900">{student.name}</p>
            </div>
            <p className="text-sm text-blue-700 ml-6">{student.email}</p>
            
            {studentPricing && !pricingLoading && (
              <div className="mt-3 ml-6 p-3 bg-white rounded border">
                <p className="text-sm font-medium text-gray-700 mb-2">Individual Rates</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="text-center p-2 bg-blue-50 rounded">
                    <div className="font-semibold text-blue-900">
                      ₱{studentPricing.monthly?.toLocaleString()}
                    </div>
                    <div className="text-xs text-blue-600">Monthly</div>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded">
                    <div className="font-semibold text-green-900">
                      ₱{studentPricing.yearly?.toLocaleString()}
                    </div>
                    <div className="text-xs text-green-600">Yearly</div>
                  </div>
                </div>
                {studentPricing.isLegacy && (
                  <p className="text-xs text-purple-600 mt-2">🌟 Grandfathered pricing</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm">✅ {successMessage}</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">❌ {error}</p>
          </div>
        )}

        {/* Form */}
        <div className="space-y-4">
          {/* Quick select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Select {studentPricing && `(${studentPricing.tier})`}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleMembershipTypeChange("MONTHLY")}
                disabled={loading || pricingLoading || isSubmitting}
                className={`p-4 rounded-lg border text-sm transition-colors disabled:opacity-50 ${
                  formData.membershipType === "MONTHLY"
                    ? "bg-blue-50 border-blue-500 text-blue-700"
                    : "bg-white border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="text-center">
                  <div className="font-medium">Monthly</div>
                  <div className="text-lg font-bold">
                    ₱{membershipPrices.MONTHLY.toLocaleString()}
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleMembershipTypeChange("YEARLY")}
                disabled={loading || pricingLoading || isSubmitting}
                className={`p-4 rounded-lg border text-sm transition-colors disabled:opacity-50 ${
                  formData.membershipType === "YEARLY"
                    ? "bg-blue-50 border-blue-500 text-blue-700"
                    : "bg-white border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="text-center">
                  <div className="font-medium">Yearly</div>
                  <div className="text-lg font-bold">
                    ₱{membershipPrices.YEARLY.toLocaleString()}
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Payment Amount (₱)
            </label>
            <input
              id="amount"
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              disabled={loading || pricingLoading || isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>

          {/* Method */}
          <div>
            <label htmlFor="method" className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method
            </label>
            <select
              id="method"
              name="method"
              value={formData.method}
              onChange={handleInputChange}
              disabled={loading || isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              {paymentMethods.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
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
              disabled={loading || isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>

          {/* Extend membership */}
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="extendMembership"
                checked={formData.extendMembership}
                onChange={handleInputChange}
                disabled={loading || isSubmitting}
                className="rounded text-blue-600"
              />
              <span className="text-sm font-medium text-gray-700">
                Extend Membership ({formData.membershipType === "MONTHLY" ? "30 days" : "365 days"})
              </span>
            </label>
          </div>

          {/* Payment date */}
          <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
            <label className="block text-sm font-medium text-gray-700 mb-3">Payment Date</label>

            <div className="space-y-3">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="paymentDateOption"
                  value="today"
                  checked={formData.paymentDateOption === "today"}
                  onChange={(e) => handlePaymentDateOptionsChange(e.target.value)}
                  disabled={loading || isSubmitting}
                  className="text-blue-600"
                />
                <span className="text-sm font-medium">Today</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="paymentDateOption"
                  value="custom"
                  checked={formData.paymentDateOption === "custom"}
                  onChange={(e) => handlePaymentDateOptionsChange(e.target.value)}
                  disabled={loading || isSubmitting}
                  className="text-blue-600"
                />
                <span className="text-sm font-medium">Different Date</span>
              </label>

              {formData.paymentDateOption === "custom" && (
                <div className="ml-6">
                  <input
                    type="date"
                    value={formData.customPaymentDate}
                    onChange={handleCustomDateChange}
                    min={getMinDate()}
                    max={getMaxDate()}
                    disabled={loading || isSubmitting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                  {formData.customPaymentDate && (
                    <div className="text-xs text-gray-600 mt-2">
                      Selected: {getDisplayDate(formData.customPaymentDate)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={loading || isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={
                loading || 
                pricingLoading || 
                isSubmitting ||
                !formData.amount || 
                parseFloat(formData.amount) <= 0
              }
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading || isSubmitting ? "Processing..." : "Record Payment"}
            </button>
          </div>
        </div>

        {/* Loading overlay */}
        {(loading || pricingLoading || isSubmitting) && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-sm text-gray-600">
                {pricingLoading ? "Loading pricing..." : "Processing payment..."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;