// Line 1: Complete StudentEditForm.jsx - BJJ themed with enhanced functionality
import React, { useState } from "react";
import { useToast } from "../hooks/useToast";

// Line 5: StudentEditForm Component with BJJ theme
const StudentEditForm = ({ student, onSave, onBack }) => {
  const [formData, setFormData] = useState({
    id: student.id,
    name: student.name || "",
    email: student.email || "",
    phone: student.phone || "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useToast();

  // Line 17: Philippine phone number validation
  const validatePhoneNumber = (phone) => {
    if (!phone) return true; // Phone is optional
    const cleanPhone = phone.replace(/[-\s\(\)]/g, "");
    const phoneRegex = /^(\+63|0)?[0-9]{10,11}$/;
    return phoneRegex.test(cleanPhone);
  };

  // Line 24: Form validation with proper error handling
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (formData.phone && !validatePhoneNumber(formData.phone)) {
      newErrors.phone = "Please enter a valid Philippine phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Line 42: Handle form submission with proper error handling and navigation
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      console.log("StudentEditForm: About to save student", formData);
      
      // Call the onSave function passed from parent
      await onSave(formData);
      
      // Success handling is done in the parent component (DashboardPage)
      // The parent will show success message and navigate back
      
    } catch (error) {
      console.error("StudentEditForm: Error saving student:", error);
      showError(`Failed to update student: ${error.message}`);
      setErrors({ submit: `Failed to update student: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  // Line 65: Handle field changes with validation clearing
  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Line 74: Handle cancel/back navigation
  const handleCancel = () => {
    console.log("StudentEditForm: Cancel button clicked");
    if (onBack) {
      onBack();
    }
  };

  // Line 81: Main component render with BJJ theme
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header with BJJ theme */}
      <header className="bg-gray-800 bg-opacity-90 backdrop-blur-sm shadow-xl border-b border-gray-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <button
                onClick={handleCancel}
                className="mr-4 p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-700 transition-colors"
                title="Back to profile"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">Edit Student Profile</h1>
                <p className="text-gray-400">{student.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-500 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-xl shadow-xl border border-gray-600 p-6">
          {/* Error Message */}
          {errors.submit && (
            <div className="mb-6 p-4 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg">
              <div className="flex items-start">
                <div className="text-red-400 mr-3 mt-0.5">
                  ⚠️
                </div>
                <div>
                  <p className="text-red-300 font-medium text-sm">Error Saving Changes</p>
                  <p className="text-red-400 text-sm mt-1">{errors.submit}</p>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleFieldChange("name", e.target.value)}
                className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                  errors.name 
                    ? "border-red-400 focus:ring-red-500 focus:border-red-500" 
                    : "border-gray-600 focus:ring-red-500 focus:border-red-500"
                }`}
                placeholder="Enter student's full name"
                disabled={loading}
              />
              {errors.name && (
                <p className="text-red-400 text-sm mt-1 flex items-center">
                  <span className="mr-1">⚠️</span>
                  {errors.name}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleFieldChange("email", e.target.value)}
                className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                  errors.email 
                    ? "border-red-400 focus:ring-red-500 focus:border-red-500" 
                    : "border-gray-600 focus:ring-red-500 focus:border-red-500"
                }`}
                placeholder="student@example.com"
                disabled={loading}
              />
              {errors.email && (
                <p className="text-red-400 text-sm mt-1 flex items-center">
                  <span className="mr-1">⚠️</span>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Phone Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleFieldChange("phone", e.target.value)}
                className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                  errors.phone 
                    ? "border-red-400 focus:ring-red-500 focus:border-red-500" 
                    : "border-gray-600 focus:ring-red-500 focus:border-red-500"
                }`}
                placeholder="+63-917-123-4567 or 09171234567"
                disabled={loading}
              />
              {errors.phone && (
                <p className="text-red-400 text-sm mt-1 flex items-center">
                  <span className="mr-1">⚠️</span>
                  {errors.phone}
                </p>
              )}
              <p className="text-sm text-gray-400 mt-2">
                Optional. Philippine format: +63-xxx-xxx-xxxx or 09xxxxxxxxx
              </p>
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 pt-6 border-t border-gray-600">
              <button
                type="submit"
                disabled={loading || !formData.name.trim() || !formData.email.trim()}
                className="flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving Changes...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
              
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="flex items-center px-6 py-3 border border-gray-500 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </button>
            </div>
          </form>

          {/* Student Information Summary */}
          <div className="mt-8 pt-6 border-t border-gray-600">
            <h3 className="text-lg font-semibold text-white mb-4">Current Information</h3>
            <div className="bg-gray-700 bg-opacity-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-300">Student ID:</span>
                  <span className="ml-2 text-white">#{student.id}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-300">Original Name:</span>
                  <span className="ml-2 text-white">{student.name || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-300">Original Email:</span>
                  <span className="ml-2 text-white">{student.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-300">Original Phone:</span>
                  <span className="ml-2 text-white">{student.phone || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentEditForm;