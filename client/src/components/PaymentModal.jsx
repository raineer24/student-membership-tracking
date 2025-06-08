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

  //FormState
  const [formData, setFormData] = useState({
    amount: "",
    method: "CASH",
    description: "",
    extendMembership: true,
    membershipType: "MONTHLY",
  });

  const paymentMethods = [
    { value: "CASH", label: "💵 Cash" },
    { value: "CARD", label: "💵 Cash" },
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

  const handleSubmit = async (e) => {
    e.preventDefaul();
    if (!student) return;

    setLoading(true);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Process Payment</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            x
          </button>
        </div>

        {/* Student Info */}
        {student && (
          <div className="bg-gray-50">
            <p className="font-medium">{student.name}</p>
            <p className="text-sm">{student.email}</p>
            {student.phone && (
              <p className="text-sm text-gray-600">{student.phone}</p>
            )}
          </div>
        )}
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        <form>
          {/* Quick Membership Buttons*/}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Quick Select
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  handleMembershipTypeChange("MONTHLY");
                }}
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
                onClick={() => {
                  handleMembershipTypeChange("YEARLY");
                }}
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
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount ($)
            </label>
            <input
              type="number"
              name="amount"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter Amount"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                {paymentMethods.map(method => (
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
                rows='2'
                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                 placeholder="Payment notes..."
                
            />  
          </div>

          {/* Extend Membersghip */}
          <div className="flex items-center">
                <input 
                    type="checkbox" 
                    name='extendMembership'
                    checked={formData.extendMembership}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                <label className="ml-2 block text-sm text-gray-700">
                    Extend/create membership
                </label>
          </div>

          {/* Action Buttons */}
          <div>
            <button
            type="button"
            onClick={onClose}
                 className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
                Cancel
            </button>
            <button
            type="submit"
            disabled={loading || !formData.amount}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {loading ? 'Processing...' : "💳 Process Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;
