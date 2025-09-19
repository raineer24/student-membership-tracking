// File: client/src/components/StudentEditForm.jsx
// ENHANCED: Added Age and Parent/Guardian fields for comprehensive student information
// Lines 15-20: Extended formData state with new fields
// Lines 120-180: Added Age and Parent input fields with validation
import React, { useState, useRef, useCallback } from "react";
import { useToast } from "../hooks/useToast";

const StudentEditForm = ({ student, onSave, onBack, isSaving }) => {
  // ENHANCED: Lines 15-20 - Extended formData state with Age and Parent fields
  const [formData, setFormData] = useState({
    id: student.id,
    name: student.name || "",
    email: student.email || "",
    phone: student.phone || "",
    age: student.age || "",
    parent: student.parent || student.parentName || "",
    monthlyRate: student.monthlyRate || 1400,
    isLegacyStudent: student.isLegacyStudent || false,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const isSubmittingRef = useRef(false);
  const { showSuccess, showError } = useToast();

  // Philippine phone number validation
  const validatePhoneNumber = (phone) => {
    if (!phone) return true;
    const cleanPhone = phone.replace(/[-\s\(\)]/g, "");
    const phoneRegex = /^(\+63|0)?[0-9]{10,11}$/;
    return phoneRegex.test(cleanPhone);
  };

  // ENHANCED: Lines 35-45 - Age validation function
  const validateAge = (age) => {
    if (!age) return true; // Age is optional
    const ageNum = parseInt(age);
    return ageNum >= 3 && ageNum <= 100; // Reasonable age range for martial arts students
  };

  // Enhanced form validation with new fields
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

    // ENHANCED: Age validation
    if (formData.age && !validateAge(formData.age)) {
      newErrors.age = "Age must be between 3 and 100 years";
    }

    // ENHANCED: Parent name validation for minors
    if (
      formData.age &&
      parseInt(formData.age) < 18 &&
      !formData.parent?.trim()
    ) {
      newErrors.parent =
        "Parent/Guardian name is required for students under 18";
    }

    if (
      formData.monthlyRate &&
      (formData.monthlyRate < 100 || formData.monthlyRate > 10000)
    ) {
      newErrors.monthlyRate = "Monthly rate must be between ₱100 and ₱10,000";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const handleSubmit = useCallback(async (e) => {
  e.preventDefault();

  if (loading || hasSubmitted || isSubmittingRef.current || isSaving) {
    return;
  }

  if (!validateForm()) {
    return;
  }

  setLoading(true);
  setHasSubmitted(true);
  isSubmittingRef.current = true;

  try {
    // CRITICAL FIX: Explicit field extraction
    const saveData = {
      id: formData.id,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      age: formData.age && formData.age.toString().trim() !== "" ? parseInt(formData.age) : null,
      parent: formData.parent && formData.parent.toString().trim() !== "" ? formData.parent.toString().trim() : null,
      monthlyRate: formData.monthlyRate ? parseFloat(formData.monthlyRate) : 1400,
      isLegacyStudent: Boolean(formData.isLegacyStudent),
    };
    
    console.log('FIXED - Sending data:', saveData);
    await onSave(saveData);
  } catch (error) {
    console.error('Form submission error:', error);
    showError(`Failed to update student: ${error.message}`);
    setErrors({ submit: `Failed to update student: ${error.message}` });
    setHasSubmitted(false);
    isSubmittingRef.current = false;
  } finally {
    setLoading(false);
  }
}, [loading, hasSubmitted, isSaving, formData, onSave, showError, validateForm]);

  // Handle field changes
  const handleFieldChange = useCallback(
    (field, value) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: "" }));
      }

      // ENHANCED: Clear parent error when age becomes 18 or older
      if (field === "age" && parseInt(value) >= 18 && errors.parent) {
        setErrors((prev) => ({ ...prev, parent: "" }));
      }
    },
    [errors]
  );

  // FIXED handle cancel/back navigation
  const handleCancel = useCallback(() => {
    if (onBack && typeof onBack === "function") {
      onBack();
    }
  }, [onBack]);

  // Reset form when student changes
  React.useEffect(() => {
    setHasSubmitted(false);
    isSubmittingRef.current = false;
  }, [student.id]);

  // Main component render
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header with enhanced back button */}
      <header className="bg-gray-800 bg-opacity-90 backdrop-blur-sm shadow-xl border-b border-gray-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <button
                onClick={handleCancel}
                className="mr-4 p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-700 transition-colors"
                title="Back to dashboard"
                disabled={loading || hasSubmitted || isSaving}
                type="button"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Edit Student Profile
                </h1>
                <p className="text-gray-400">{student.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-500 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-colors"
                disabled={loading || hasSubmitted || isSaving}
                type="button"
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
                <div className="text-red-400 mr-3 mt-0.5">⚠️</div>
                <div>
                  <p className="text-red-300 font-medium text-sm">
                    Error Saving Changes
                  </p>
                  <p className="text-red-400 text-sm mt-1">{errors.submit}</p>
                </div>
              </div>
            </div>
          )}

          {/* Submission Status */}
          {(hasSubmitted || isSaving) && (
            <div className="mb-6 p-4 bg-blue-500 bg-opacity-20 border border-blue-500 rounded-lg">
              <div className="flex items-center">
                <div className="text-blue-400 mr-3">ℹ️</div>
                <p className="text-blue-300 text-sm">
                  Changes are being saved...
                </p>
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
                disabled={loading || hasSubmitted || isSaving}
              />
              {errors.name && (
                <p className="text-red-400 text-sm mt-1 flex items-center">
                  <span className="mr-1">⚠️</span>
                  {errors.name}
                </p>
              )}
            </div>

            {/* ENHANCED: Lines 120-180 - Age and Parent fields in a responsive grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Age Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Age
                </label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleFieldChange("age", e.target.value)}
                  className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                    errors.age
                      ? "border-red-400 focus:ring-red-500 focus:border-red-500"
                      : "border-gray-600 focus:ring-red-500 focus:border-red-500"
                  }`}
                  placeholder="Enter age (3-100)"
                  min="3"
                  max="100"
                  disabled={loading || hasSubmitted || isSaving}
                />
                {errors.age && (
                  <p className="text-red-400 text-sm mt-1 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {errors.age}
                  </p>
                )}
                <p className="text-sm text-gray-400 mt-2">
                  Optional. Helps with class grouping and safety protocols.
                </p>
              </div>

              {/* Parent/Guardian Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Parent/Guardian{" "}
                  {formData.age && parseInt(formData.age) < 18 && (
                    <span className="text-red-500">*</span>
                  )}
                </label>
                <input
                  type="text"
                  value={formData.parent}
                  onChange={(e) => handleFieldChange("parent", e.target.value)}
                  className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                    errors.parent
                      ? "border-red-400 focus:ring-red-500 focus:border-red-500"
                      : "border-gray-600 focus:ring-red-500 focus:border-red-500"
                  }`}
                  placeholder="Enter parent/guardian name"
                  disabled={loading || hasSubmitted || isSaving}
                />
                {errors.parent && (
                  <p className="text-red-400 text-sm mt-1 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {errors.parent}
                  </p>
                )}
                <p className="text-sm text-gray-400 mt-2">
                  {formData.age && parseInt(formData.age) < 18
                    ? "Required for students under 18. Emergency contact and consent authority."
                    : "Optional. Primary emergency contact for adult students."}
                </p>
              </div>
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
                disabled={loading || hasSubmitted || isSaving}
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
                disabled={loading || hasSubmitted || isSaving}
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

            {/* Monthly Rate Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Monthly Rate (₱)
              </label>
              <input
                type="number"
                value={formData.monthlyRate}
                onChange={(e) =>
                  handleFieldChange(
                    "monthlyRate",
                    parseInt(e.target.value) || 1400
                  )
                }
                className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                  errors.monthlyRate
                    ? "border-red-400 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-600 focus:ring-red-500 focus:border-red-500"
                }`}
                placeholder="1400"
                min="100"
                max="10000"
                step="100"
                disabled={loading || hasSubmitted || isSaving}
              />
              {errors.monthlyRate && (
                <p className="text-red-400 text-sm mt-1 flex items-center">
                  <span className="mr-1">⚠️</span>
                  {errors.monthlyRate}
                </p>
              )}
              <p className="text-sm text-gray-400 mt-2">
                Standard rate: ₱1,400/month. Legacy members may have different
                rates.
              </p>
            </div>

            {/* Legacy Student Checkbox */}
            <div>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.isLegacyStudent}
                  onChange={(e) =>
                    handleFieldChange("isLegacyStudent", e.target.checked)
                  }
                  className="w-4 h-4 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500 focus:ring-2"
                  disabled={loading || hasSubmitted || isSaving}
                />
                <div>
                  <span className="text-sm font-medium text-gray-300">
                    Legacy Student
                  </span>
                  <p className="text-xs text-gray-400 mt-1">
                    Check if this student has grandfathered pricing (founding
                    members, early adopters, etc.)
                  </p>
                </div>
              </label>
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 pt-6 border-t border-gray-600">
              <button
                type="submit"
                disabled={
                  loading ||
                  hasSubmitted ||
                  isSaving ||
                  !formData.name.trim() ||
                  !formData.email.trim()
                }
                className="flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                {loading || hasSubmitted || isSaving ? (
                  <>
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
                    Saving Changes...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>

              <button
                type="button"
                onClick={handleCancel}
                disabled={loading || hasSubmitted || isSaving}
                className="flex items-center px-6 py-3 border border-gray-500 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-colors disabled:opacity-50"
              >
                <svg
                  className="w-5 h-5 mr-2"
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
                Cancel
              </button>
            </div>
          </form>

          {/* ENHANCED: Student Information Summary with new fields */}
          <div className="mt-8 pt-6 border-t border-gray-600">
            <h3 className="text-lg font-semibold text-white mb-4">
              Current Information
            </h3>
            <div className="bg-gray-700 bg-opacity-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-300">Student ID:</span>
                  <span className="ml-2 text-white">#{student.id}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-300">
                    Original Name:
                  </span>
                  <span className="ml-2 text-white">
                    {student.name || "N/A"}
                  </span>
                </div>

                {/* ENHANCED: Display original age and parent info */}
                <div>
                  <span className="font-medium text-gray-300">
                    Original Age:
                  </span>
                  <span className="ml-2 text-white">
                    {student.age || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-300">
                    Original Parent:
                  </span>
                  <span className="ml-2 text-white">
                    {student.parent || student.parentName || "N/A"}
                  </span>
                </div>

                <div>
                  <span className="font-medium text-gray-300">
                    Original Email:
                  </span>
                  <span className="ml-2 text-white">
                    {student.email || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-300">
                    Original Phone:
                  </span>
                  <span className="ml-2 text-white">
                    {student.phone || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-300">
                    Original Rate:
                  </span>
                  <span className="ml-2 text-white">
                    ₱{(student.monthlyRate || 1400).toLocaleString()}/month
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-300">
                    Legacy Status:
                  </span>
                  <span className="ml-2 text-white">
                    {student.isLegacyStudent ? (
                      <span className="text-purple-400">🌟 Legacy Student</span>
                    ) : (
                      <span className="text-green-400">Standard Member</span>
                    )}
                  </span>
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
