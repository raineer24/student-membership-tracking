import React, { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";

const WeekendEventModal = ({
  isOpen,
  onClose,
  onEventCreated,
  existingEvents,
}) => {
  const { token } = useAuth();
  const { showSuccess, showError } = useToast();

  const [formData, setFormData] = useState({
    eventType: "NO_CLASSES",
    title: "",
    message: "",
    startDate: "",
    endDate: "",
    sendSMS: true,
    priority: "normal",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPreview, setShowPreview] = useState(false);
  const modalRef = useRef(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      setFormData((prev) => ({
        ...prev,
        startDate: tomorrow.toISOString().split("T")[0],
        title: prev.eventType === "NO_CLASSES" ? "No Classes This Weekend" : "",
        message:
          prev.eventType === "NO_CLASSES"
            ? "Enjoy your weekend! Classes will resume on Monday."
            : "",
      }));

      //Focus management for accessibility
      setTimeout(() => {
        if (modalRef.current) {
          const firstInput = modalRef.current.querySelector(
            "select, input, textarea"
          );
          firstInput?.focus();
        }
      }, 100);
    } else {
      setFormData({
        eventType: "NO_CLASSES",
        title: "",
        message: "",
        startDate: "",
        endDate: "",
        sendSMS: true,
        priority: "normal",
      });
      setErrors({});
      setIsSubmitting(false);
      setShowPreview(false);
    }
  }, [isOpen]);

  //Enhanced validation with conflict detection
  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    } else if (formData.message.length > 300) {
      newErrors.message = "Message must be 300 characters or less";
    }

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.length > 100) {
      newErrors.title = "Title must be 100 characters or less";
    }

    if (!formData.startDate) {
      newErrors.startDate = "Start date is required";
    } else {
      const startDate = new Date(formData.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (startDate < today) {
        newErrors.startDate = "Start date cannot be in the past";
      }
    }

    if (!formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      if (endDate < startDate) {
        newErrors.endDate = "End date must be after start date";
      }
    }

    return newErrors;
  }, [formData]);

  // Handle input changes with smart suggestions
  const handleInputChange = useCallback(
    (e) => {
      const { name, value, type, checked } = e.target;

      setFormData((prev) => {
        const newData = {
          ...prev,
          [name]: type === "checkbox" ? checked : value,
        };

        if (name === "eventType") {
          switch (value) {
            case "NO_CLASSES":
              newData.title = "No Classes This Weekend";
              newData.message =
                "Enjoy your weekend! Classes will resume on Monday.";
              break;
            case "GENERAL":
              newData.title = "General Announcement";
              newData.message = "Please read this important update.";
              break;
          }
        }

        return newData;
      });

      if (erros[name]) {
        setErrors((prev) => ({ ...prev, [name]: "" }));
      }
    },
    [errors]
  );

  // Handle form submission
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      const validationErrors = validateForm();
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }

      setIsSubmitting(true);
      setErrors({});

      try {
        const response = await fetch("/api/events", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            createdBy: "admin",
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create event");
        }

        const eventData = await response.json();

        showSuccess(`Weekend event "${formData.title}" created successfully!`);
        onEventCreated(eventData);
        onClose();
      } catch (error) {
        showError(`Failed to create event: ${error.message}`);
        setErrors({ submit: "Failed" });
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      formData,
      validateForm,
      token,
      onEventCreated,
      onClose,
      showSuccess,
      showError,
    ]
  );

  // Character count helper
  const getCharacterCount = (text, maxLength) => {
    const count = text.length;
    const percentage = (count / maxLength) * 100;

    let colorClass = "text-gray-500";
    if (percentage > 90) colorClass = "text-red-600";
    else if (percentrage > 75) colorClass = "text-red-500";

    return { count, colorClass };
  };

  //keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const titleCount = getCharacterCount(formData.title, 100);
  const mesageCount = getCharacterCount(formData.message, 300);

  return (
    <div className="fixed inset-0 bg-black">
      <div ref={modalRef} className="bg-white rounded-xl shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">📅 Create Weekend Event</h2>
              <p className="text-blue-100 text-sm mt-1">
                Design and schedule your announcement
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors p-1 rounded"
              disabled={isSubmitting}
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

         <form onSubmit={handleSubmit} className="p-6">
          {/* Event Type */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Type *
            </label>
            <select
              name="eventType"
              value={formData.eventType}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSubmitting}
            >
              <option value="NO_CLASSES">🚫 No Classes</option>
              <option value="GENERAL">📢 General Announcement</option>
              <option value="BANNER">🎯 Important Banner</option>
              <option value="SMS">📱 SMS Only</option>
            </select>
          </div>

          {/* Title */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
              <span className={`ml-2 text-xs ${titleCount.colorClass}`}>
                ({titleCount.count}/100)
              </span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., No Classes This Weekend"
              maxLength={100}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.title ? 'border-red-300 bg-red-50' : 'border-gray-200'
              }`}
              disabled={isSubmitting}
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>

          {/* Message */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message *
              <span className={`ml-2 text-xs ${messageCount.colorClass}`}>
                ({messageCount.count}/300)
              </span>
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              placeholder="e.g., Enjoy your weekend! Classes resume Monday."
              maxLength={300}
              rows={4}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                errors.message ? 'border-red-300 bg-red-50' : 'border-gray-200'
              }`}
              disabled={isSubmitting}
            />
            {errors.message && <p className="mt-1 text-sm text-red-600">{errors.message}</p>}
            <p className="mt-1 text-xs text-gray-500">SMS messages will be truncated to 160 characters</p>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.startDate ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
                disabled={isSubmitting}
              />
              {errors.startDate && <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date <span className="text-gray-500">(Optional)</span>
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                min={formData.startDate}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.endDate ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
                disabled={isSubmitting}
              />
              {errors.endDate && <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>}
            </div>
          </div>

          {/* SMS Option */}
          <div className="mb-6">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  name="sendSMS"
                  checked={formData.sendSMS}
                  onChange={handleInputChange}
                  className="mt-1 text-blue-600 focus:ring-blue-500"
                  disabled={isSubmitting}
                />
                <div>
                  <label className="text-sm font-medium text-gray-900">
                    📱 Send SMS notification to all students
                  </label>
                  <p className="text-sm text-gray-600 mt-1">
                    SMS will be sent immediately to all students with phone numbers (₱0.35 per SMS)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{errors.submit}</p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || Object.keys(validateForm()).length > 0}
              className="px-8 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Announcement</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WeekendEventModal;
