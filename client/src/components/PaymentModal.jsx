import { useState } from "react";
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

  // Form State
  const [formData, setFormData] = useState({
    amount: "",
    method: "CASH",
    description: "",
    extendMembership: true,
    membershipType: "MONTHLY",
  });

  const paymentMethods = [
    { value: "CASH", label: "💵 Cash" },
    { value: "CARD", label: "💳 Card" },
    { value: "BANK_TRANSFER", label: "🏦 Bank Transfer" },
    { value: "ONLINE", label: "🌐 Online Payment" },
    { value: "CHECK", label: "📝 Check" },
    { value: "OTHER", label: "📋 Other" },
  ];

  const membershipPrices = {
    MONTHLY: 1400,
    YEARLY: 16800,
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleMembershipTypeChange = (type) => {
    setFormData((prev) => ({
      ...prev,
      membershipType: type,
      amount: membershipPrices[type].toString(),
    }));
  };

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

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // ✅ Fixed typo from preventDefault()
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const paymentData = {
        studentId: student.id,
        amount: parseFloat(formData.amount),
        method: formData.method,
        description: formData.description || `${formData.membershipType} membership payment`,
        extendMembership: formData.extendMembership,
        membershipType: formData.membershipType,
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
        throw new Error(responseData.error || `Payment failed: ${response.status}`);
      }

      console.log("Payment successful:", responseData);

      // Call success callback with comprehensive data
      onPaymentSuccess({
        payment: responseData,
        student: student,
        membershipExtended: formData.extendMembership,
        amount: parseFloat(formData.amount),
        method: formData.method,
      });

      // Reset form to initial state
      setFormData({
        amount: "",
        method: "CASH",
        description: "",
        extendMembership: true,
        membershipType: "MONTHLY",
      });

      // Close modal
      onClose();
    } catch (error) {
      console.error("Payment error:", error);
      setError(error.message || "Payment processing failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Reset form when modal opens/closes
  const handleClose = () => {
    setFormData({
      amount: "",
      method: "CASH",
      description: "",
      extendMembership: true,
      membershipType: "MONTHLY",
    });
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Process Payment</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            type="button"
          >
            ×
          </button>
        </div>

        {/* Student Info */}
        {student && (
          <div className="bg-gray-50 rounded-md p-3 mb-4">
            <p className="font-medium text-gray-900">{student.name}</p>
            <p className="text-sm text-gray-600">{student.email}</p>
            {student.phone && (
              <p className="text-sm text-gray-600">{student.phone}</p>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <p className="text-red-800 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quick Membership Buttons */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Quick Select
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleMembershipTypeChange("MONTHLY")}
                className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                  formData.membershipType === "MONTHLY"
                    ? "bg-blue-50 border-blue-500 text-blue-700"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                📅 Monthly
                <br />
                <span className="text-lg font-bold">
                  ${membershipPrices.MONTHLY}
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleMembershipTypeChange("YEARLY")}
                className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                  formData.membershipType === "YEARLY"
                    ? "bg-blue-50 border-blue-500 text-blue-700"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                📅 Yearly
                <br />
                <span className="text-lg font-bold">
                  ${membershipPrices.YEARLY}
                </span>
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount ($) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="amount"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter amount"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method
            </label>
            <select
              name="method"
              value={formData.method}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Payment notes..."
            />
          </div>

          {/* Extend Membership Checkbox */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="extendMembership"
              checked={formData.extendMembership}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700">
              Extend/create membership ({formData.membershipType === "MONTHLY" ? "30 days" : "365 days"})
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.amount || parseFloat(formData.amount) <= 0}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                "💳 Process Payment"
              )}
            </button>
          </div>
        </form>

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-sm text-gray-600">Processing payment...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;