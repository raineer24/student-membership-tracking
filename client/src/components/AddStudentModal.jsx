// Line 1-10: Complete AddStudentModal.jsx - FIXED with correct prop handling
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

// Line 5-10: FIXED - Accept both prop names for backward compatibility and proper function calls
const AddStudentModal = ({ isOpen, onClose, onStudentAdded, onSuccess }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Line 10-17: Consistent form state with camelCase naming for better maintainability
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
  });

  // Line 20-27: Handle input changes with robust error clearing
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear specific errors when user starts typing
    if (error) setError(null);
  };

  // Line 30-70: Enhanced validation logic with detailed error messages
  const validateForm = () => {
    // Reset error state
    setError(null);

    if (!formData.firstName?.trim()) {
      setError("First name is required");
      return false;
    }

    if (!formData.lastName?.trim()) {
      setError("Last name is required");
      return false;
    }

    if (!formData.email?.trim()) {
      setError("Email is required");
      return false;
    }

    // Enhanced email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError("Please enter a valid email address");
      return false;
    }
    
    if (!formData.password || formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }

    // Line 60-70: Enhanced phone validation for Philippine numbers (optional field)
    if (formData.phone?.trim()) {
      const cleaned = formData.phone.replace(/[\s\-\(\)]/g, '');
      const isValid = /^\+639\d{9}$/.test(cleaned) || /^09\d{9}$/.test(cleaned) || /^639\d{9}$/.test(cleaned);
      if (!isValid) {
        setError("Please enter a valid Philippine mobile number (e.g., 09123456789)");
        return false;
      }
    }

    return true;
  };

  // Line 75-120: Enhanced submit handler with FIXED callback handling
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      // Line 85-95: Prepare request data with proper formatting
      const requestData = {
        name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        email: formData.email.trim(),
        phone: formData.phone?.trim() || undefined,
        password: formData.password,
        role: 'student',
      };

      const response = await fetch("/api/students", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create student");
      }

      const newStudent = await response.json();

      // Line 110-120: FIXED - Safe callback execution with BOTH prop names for compatibility
      // Try onStudentAdded first (preferred), then onSuccess (parent might be using this)
      if (typeof onStudentAdded === 'function') {
        onStudentAdded(newStudent);
      } else if (typeof onSuccess === 'function') {
        onSuccess(newStudent);
      }

      // Reset form and close modal on success
      resetForm();
      handleClose();
    } catch (error) {
      console.error("Error creating student:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Line 125-135: Helper function to reset form state
  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
    });
  };

  // Line 140-150: FIXED - Safe close handler with enhanced prop validation
  const handleClose = () => {
    resetForm();
    setError(null);
    
    // FIXED - Safe function call with validation to prevent runtime errors
    if (typeof onClose === 'function') {
      onClose();
    } else {
      console.warn('AddStudentModal: onClose prop is not a function');
    }
  };

  // Early return if modal is not open - performance optimization
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
        {/* Line 160-175: Header with accessible close button */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900">Add New Student</h2>
          <button 
            onClick={handleClose} 
            className="text-gray-400 hover:text-red-500 transition-colors p-1"
            type="button"
            aria-label="Close modal"
            disabled={loading}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Line 180-190: Error Message Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-800 text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Line 195-360: Enhanced Form with better UX */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Line 200-215: First Name input with enhanced accessibility */}
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              First Name *
            </label>
            <input
              id="firstName"
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 transition-colors"
              placeholder="Juan"
              autoComplete="given-name"
            />
          </div>

          {/* Line 220-235: Last Name input with enhanced accessibility */}
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Last Name *
            </label>
            <input
              id="lastName"
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 transition-colors"
              placeholder="Dela Cruz"
              autoComplete="family-name"
            />
          </div>

          {/* Line 240-255: Email input with enhanced validation */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 transition-colors"
              placeholder="student@example.com"
              autoComplete="email"
            />
          </div>

          {/* Line 260-280: Phone input with helper text */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 transition-colors"
              placeholder="09123456789"
              autoComplete="tel"
            />
            <p className="text-xs text-gray-500 mt-1">
              💡 Optional - for SMS reminders (Philippine mobile format)
            </p>
          </div>

          {/* Line 285-300: Password input with security considerations */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password *
            </label>
            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 transition-colors"
              placeholder="Minimum 6 characters"
              autoComplete="new-password"
              minLength="6"
            />
            <p className="text-xs text-gray-500 mt-1">
              🔒 Must be at least 6 characters long
            </p>
          </div>

          {/* Line 305-350: Submit buttons with enhanced UX */}
          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                loading || 
                !formData.firstName?.trim() || 
                !formData.lastName?.trim() || 
                !formData.email?.trim() || 
                !formData.password
              }
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
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
                  Creating Student...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Student
                </span>
              )}
            </button>
          </div>
        </form>

        {/* Line 355-375: Loading overlay for better UX */}
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
              <p className="text-sm text-gray-600">Creating student account...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddStudentModal;