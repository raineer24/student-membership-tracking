// File: client/src/components/modals/WeekendEventModal.jsx
// Line 1: ENHANCED - Weekend Event Modal with Selective Student Messaging
import React, { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";

const WeekendEventModal = ({
  isOpen,
  onClose,
  onEventCreated,
  existingEvents = [],
  students = [], // NEW: Pass students data for recipient calculation
}) => {
  const { token } = useAuth();
  const { showSuccess, showError } = useToast();

  const [formData, setFormData] = useState({
    eventType: "NO_CLASSES",
    title: "",
    message: "",
    startDate: "",
    endDate: "",
    sendSMS: false, // CHANGED: Default to false for deliberate selection
    priority: "NORMAL",
    // NEW: Selective messaging options
    recipientOptions: {
      activeStudents: true,
      expiringStudents: true,
      overdueStudents: true,
      inactiveStudents: false, // Default: don't send to inactive
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [recipientStats, setRecipientStats] = useState({
    active: 0,
    expiring: 0,
    overdue: 0,
    inactive: 0,
    totalSelected: 0,
    estimatedCost: 0,
  });
  // NEW: Individual student selection state
  const [studentSelection, setStudentSelection] = useState({
    mode: "categories", // "categories" or "individual"
    selectedStudentIds: new Set(),
    searchQuery: "", // NEW: Search filter for students
  });
  const modalRef = useRef(null);

  // Line 45: Helper function to get student status (matches existing logic)
  const getStudentStatus = useCallback((student) => {
    if (!student?.memberships || student.memberships.length === 0) {
      return "inactive";
    }

    // Use latest membership
    const sortedMemberships = [...student.memberships].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.endDate || a.startDate);
      const dateB = new Date(b.createdAt || b.endDate || b.startDate);
      return dateB - dateA;
    });

    const latestMembership = sortedMemberships[0];
    if (!latestMembership?.endDate) return "inactive";

    const endDate = new Date(latestMembership.endDate);
    const today = new Date();
    const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
   const diffDays = Math.round((endDateOnly - todayOnly) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "overdue";
    if (diffDays <= 7) return "expiring";
    return "active";
  }, []);

  // Line 74: Calculate recipient statistics whenever options change
  useEffect(() => {
    if (!Array.isArray(students) || students.length === 0) {
      setRecipientStats({
        active: 0,
        expiring: 0,
        overdue: 0,
        inactive: 0,
        totalSelected: 0,
        estimatedCost: 0,
      });
      return;
    }

    let totalSelected = 0;
    let estimatedCost = 0;

    if (studentSelection.mode === "individual") {
      // Count individually selected students with phone numbers
      totalSelected = students.filter(student => {
        const hasPhone = Boolean(student.phone || student.phoneNumber);
        return hasPhone && studentSelection.selectedStudentIds.has(student.id);
      }).length;
    } else {
      // Original category-based calculation
      const stats = students.reduce(
        (acc, student) => {
          const hasPhone = Boolean(student.phone || student.phoneNumber);
          if (!hasPhone) return acc;

          const status = getStudentStatus(student);
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        },
        { active: 0, expiring: 0, overdue: 0, inactive: 0 }
      );

      if (formData.recipientOptions.activeStudents) totalSelected += stats.active;
      if (formData.recipientOptions.expiringStudents) totalSelected += stats.expiring;
      if (formData.recipientOptions.overdueStudents) totalSelected += stats.overdue;
      if (formData.recipientOptions.inactiveStudents) totalSelected += stats.inactive;

      setRecipientStats({
        ...stats,
        totalSelected,
        estimatedCost: totalSelected * 0.60,
      });
      return;
    }

    estimatedCost = totalSelected * 0.60;

    setRecipientStats(prev => ({
      ...prev,
      totalSelected,
      estimatedCost,
    }));
  }, [students, formData.recipientOptions, studentSelection, getStudentStatus]);

  // Line 114: Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      setFormData({
        eventType: "NO_CLASSES",
        title: "No Classes This Weekend",
        message: "Enjoy your weekend! Classes will resume on Monday.",
        startDate: tomorrow.toISOString().split("T")[0],
        endDate: "",
        sendSMS: false, // Default to false for deliberate selection
        priority: "NORMAL",
        recipientOptions: {
          activeStudents: true,
          expiringStudents: true,
          overdueStudents: true,
          inactiveStudents: false,
        },
      });

      // Reset student selection
      setStudentSelection({
        mode: "categories",
        selectedStudentIds: new Set(),
        searchQuery: "",
      });

      setTimeout(() => {
        if (modalRef.current) {
          const firstInput = modalRef.current.querySelector("select, input, textarea");
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
        sendSMS: false,
        priority: "NORMAL",
        recipientOptions: {
          activeStudents: true,
          expiringStudents: true,
          overdueStudents: true,
          inactiveStudents: false,
        },
      });

      // Reset student selection
      setStudentSelection({
        mode: "categories",
        selectedStudentIds: new Set(),
        searchQuery: "",
      });
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Line 154: Enhanced form validation
  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.length > 100) {
      newErrors.title = "Title must be 100 characters or less";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    } else if (formData.message.length > 300) {
      newErrors.message = "Message must be 300 characters or less";
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

    if (formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      if (endDate < startDate) {
        newErrors.endDate = "End date must be after start date";
      }
    }

    // NEW: Validate SMS recipient selection
    if (formData.sendSMS) {
      if (studentSelection.mode === "individual") {
        if (studentSelection.selectedStudentIds.size === 0) {
          newErrors.recipients = "Please select at least one student for SMS";
        }
      } else {
        const hasAnyRecipients = Object.values(formData.recipientOptions).some(selected => selected);
        if (!hasAnyRecipients) {
          newErrors.recipients = "Please select at least one student category for SMS";
        } else if (recipientStats.totalSelected === 0) {
          newErrors.recipients = "No students with phone numbers in selected categories";
        }
      }
    }

    return newErrors;
  }, [formData, recipientStats.totalSelected, studentSelection]);

  // Line 195: Enhanced input change handler
  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => {
      if (name.startsWith("recipient_")) {
        // Handle recipient option changes
        const optionName = name.replace("recipient_", "");
        return {
          ...prev,
          recipientOptions: {
            ...prev.recipientOptions,
            [optionName]: checked,
          },
        };
      }

      const newData = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };

      // Auto-populate titles and messages based on event type
      if (name === "eventType") {
        switch (value) {
          case "NO_CLASSES":
            newData.title = "No Classes This Weekend";
            newData.message = "Enjoy your weekend! Classes will resume on Monday.";
            break;
          case "GENERAL":
            newData.title = "General Announcement";
            newData.message = "Please read this important update.";
            break;
          case "BANNER":
            newData.title = "Important Notice";
            newData.message = "This is an important announcement.";
            break;
          case "SMS":
            newData.title = "SMS Notification";
            newData.message = "This message will be sent via SMS.";
            break;
          default:
            break;
        }
      }

      return newData;
    });

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  }, [errors]);

  // NEW: Handle selection mode change
  const handleSelectionModeChange = useCallback((mode) => {
    setStudentSelection(prev => ({
      ...prev,
      mode,
      selectedStudentIds: new Set(), // Reset selections when switching modes
      searchQuery: "", // Reset search when switching modes
    }));
  }, []);

  // NEW: Handle student search
  const handleStudentSearch = useCallback((query) => {
    setStudentSelection(prev => ({
      ...prev,
      searchQuery: query,
    }));
  }, []);

  // NEW: Handle individual student selection
  const handleStudentToggle = useCallback((studentId) => {
    setStudentSelection(prev => {
      const newSelected = new Set(prev.selectedStudentIds);
      if (newSelected.has(studentId)) {
        newSelected.delete(studentId);
      } else {
        newSelected.add(studentId);
      }
      return {
        ...prev,
        selectedStudentIds: newSelected,
      };
    });
  }, []);

  // Line 245: Enhanced submit handler with selective messaging
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      console.log('🚀 Creating weekend event with selective messaging...');

      // Prepare API payload with recipient options
      const apiPayload = {
        eventType: formData.eventType,
        title: formData.title,
        message: formData.message,
        startDate: formData.startDate,
        endDate: formData.endDate || null,
        sendSMS: formData.sendSMS,
        priority: formData.priority.toUpperCase(),
        // NEW: Include recipient selection options
        recipientOptions: formData.sendSMS ? (
          studentSelection.mode === "individual" 
            ? { selectedStudentIds: Array.from(studentSelection.selectedStudentIds) }
            : formData.recipientOptions
        ) : null,
      };

      console.log('📤 API Payload:', apiPayload);

      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiPayload),
      });

      console.log('📡 API Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error response:', errorText);
        
        let errorMessage = 'Failed to create event';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      console.log('✅ API Success response:', responseData);

      const eventData = responseData.data || responseData;

      // Show success message with detailed SMS info
      let successMessage = `Weekend event "${formData.title}" created successfully!`;
      if (formData.sendSMS && recipientStats.totalSelected > 0) {
        successMessage += ` SMS sent to ${recipientStats.totalSelected} students (₱${recipientStats.estimatedCost.toFixed(2)})`;
      }
      
      showSuccess(successMessage);
      onEventCreated(eventData);
      onClose();

    } catch (error) {
      console.error('❌ Weekend Event Creation Error:', error);
      
      if (error.message.includes('401')) {
        showError('Authentication failed. Please log in again.');
      } else if (error.message.includes('403')) {
        showError('You do not have permission to create events.');
      } else if (error.message.includes('404')) {
        showError('Events API not found. Please check your server configuration.');
      } else if (error.message.includes('Failed to fetch')) {
        showError('Cannot connect to server. Please check your internet connection.');
      } else {
        showError(`Failed to create event: ${error.message}`);
      }
      
      setErrors({ submit: error.message });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, token, onEventCreated, onClose, showSuccess, showError, recipientStats]);

  // Line 325: Character count helper
  const getCharacterCount = (text, maxLength) => {
    const count = text.length;
    const percentage = (count / maxLength) * 100;

    let colorClass = "text-gray-500";
    if (percentage > 90) colorClass = "text-red-600";
    else if (percentage > 75) colorClass = "text-orange-500";

    return { count, colorClass };
  };

  // Line 337: Escape key handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const titleCount = getCharacterCount(formData.title, 100);
  const messageCount = getCharacterCount(formData.message, 300);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div 
        ref={modalRef} 
        className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[95vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">📅 Create Weekend Event</h2>
              <p className="text-blue-100 text-sm mt-1">
                Design and schedule your announcement with selective SMS delivery
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors p-1 rounded"
              disabled={isSubmitting}
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
              className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.title ? 'border-red-300 bg-red-50' : 'border-gray-200'
              }`}
              disabled={isSubmitting}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
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
              className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors ${
                errors.message ? 'border-red-300 bg-red-50' : 'border-gray-200'
              }`}
              disabled={isSubmitting}
            />
            {errors.message && (
              <p className="mt-1 text-sm text-red-600">{errors.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              SMS messages will be truncated to 160 characters
            </p>
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
              {errors.startDate && (
                <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
              )}
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
              {errors.endDate && (
                <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
              )}
            </div>
          </div>

          {/* Priority */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority Level
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSubmitting}
            >
              <option value="LOW">🔵 Low Priority</option>
              <option value="NORMAL">⚪ Normal Priority</option>
              <option value="HIGH">🟡 High Priority</option>
              <option value="URGENT">🔴 Urgent Priority</option>
            </select>
          </div>

          {/* MINIMAL: SMS Options with Dropdown and Individual Selection */}
          <div className="mb-6">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              {/* SMS Enable Checkbox */}
              <div className="flex items-center space-x-3 mb-4">
                <input
                  type="checkbox"
                  name="sendSMS"
                  checked={formData.sendSMS}
                  onChange={handleInputChange}
                  className="text-blue-600 focus:ring-blue-500"
                  disabled={isSubmitting}
                />
                <label className="font-medium text-gray-900">
                  📱 Send SMS notifications to students
                </label>
              </div>

              {/* Conditional: Minimal Recipient Selection */}
              {formData.sendSMS && (
                <div className="space-y-4 border-l-4 border-blue-300 pl-4">
                  {/* Selection Mode Dropdown */}
                  <div>
                    <select
                      value={studentSelection.mode}
                      onChange={(e) => handleSelectionModeChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      disabled={isSubmitting}
                    >
                      <option value="categories">Select by Categories</option>
                      <option value="individual">Select Individual Students</option>
                    </select>
                  </div>

                  {/* Category Selection Mode */}
                  {studentSelection.mode === "categories" && (
                    <div className="flex flex-wrap gap-2">
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          name="recipient_activeStudents"
                          checked={formData.recipientOptions.activeStudents}
                          onChange={handleInputChange}
                          className="text-green-600 focus:ring-green-500 mr-2"
                          disabled={isSubmitting}
                        />
                        <span className="text-sm">🟢 Active ({recipientStats.active})</span>
                      </label>

                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          name="recipient_expiringStudents"
                          checked={formData.recipientOptions.expiringStudents}
                          onChange={handleInputChange}
                          className="text-yellow-600 focus:ring-yellow-500 mr-2"
                          disabled={isSubmitting}
                        />
                        <span className="text-sm">🟡 Expiring ({recipientStats.expiring})</span>
                      </label>

                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          name="recipient_overdueStudents"
                          checked={formData.recipientOptions.overdueStudents}
                          onChange={handleInputChange}
                          className="text-red-600 focus:ring-red-500 mr-2"
                          disabled={isSubmitting}
                        />
                        <span className="text-sm">🔴 Overdue ({recipientStats.overdue})</span>
                      </label>

                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          name="recipient_inactiveStudents"
                          checked={formData.recipientOptions.inactiveStudents}
                          onChange={handleInputChange}
                          className="text-gray-600 focus:ring-gray-500 mr-2"
                          disabled={isSubmitting}
                        />
                        <span className="text-sm">⚫ Inactive ({recipientStats.inactive})</span>
                      </label>
                    </div>
                  )}

                  {/* Individual Student Selection Mode */}
                  {studentSelection.mode === "individual" && (
                    <div className="bg-white rounded border border-gray-200 max-h-64 overflow-hidden">
                      {/* Header with Search */}
                      <div className="p-3 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Select Students</span>
                          <span className="text-xs text-gray-500">
                            {students.filter(student => Boolean(student.phone || student.phoneNumber)).length} with phone
                          </span>
                        </div>
                        {/* Search Input */}
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search students..."
                            value={studentSelection.searchQuery}
                            onChange={(e) => handleStudentSearch(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={isSubmitting}
                          />
                          {studentSelection.searchQuery && (
                            <button
                              onClick={() => handleStudentSearch("")}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* Student List */}
                      <div className="max-h-48 overflow-y-auto">
                        <div className="p-2 space-y-1">
                          {students
                            .filter(student => {
                              const hasPhone = Boolean(student.phone || student.phoneNumber);
                              const matchesSearch = studentSelection.searchQuery === "" || 
                                student.name.toLowerCase().includes(studentSelection.searchQuery.toLowerCase());
                              return hasPhone && matchesSearch;
                            })
                            .map(student => {
                              const status = getStudentStatus(student);
                              const statusEmoji = {
                                active: "🟢",
                                expiring: "🟡", 
                                overdue: "🔴",
                                inactive: "⚫"
                              }[status];

                              return (
                                <label key={student.id} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={studentSelection.selectedStudentIds.has(student.id)}
                                    onChange={() => handleStudentToggle(student.id)}
                                    className="mr-3 text-blue-600 focus:ring-blue-500"
                                    disabled={isSubmitting}
                                  />
                                  <span className="mr-2">{statusEmoji}</span>
                                  <span className="text-sm text-gray-900">{student.name}</span>
                                </label>
                              );
                            })}
                          
                          {/* No Results Message */}
                          {students.filter(student => {
                            const hasPhone = Boolean(student.phone || student.phoneNumber);
                            const matchesSearch = studentSelection.searchQuery === "" || 
                              student.name.toLowerCase().includes(studentSelection.searchQuery.toLowerCase());
                            return hasPhone && matchesSearch;
                          }).length === 0 && (
                            <div className="p-4 text-center text-gray-500">
                              {studentSelection.searchQuery ? (
                                <div>
                                  <p className="text-sm">No students found matching "{studentSelection.searchQuery}"</p>
                                  <button
                                    onClick={() => handleStudentSearch("")}
                                    className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                                  >
                                    Clear search
                                  </button>
                                </div>
                              ) : (
                                <p className="text-sm">No students with phone numbers found</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SMS Summary */}
                  <div className="flex justify-between items-center p-3 bg-purple-50 border border-purple-200 rounded">
                    <span className="text-sm font-medium text-purple-900">
                      {recipientStats.totalSelected} recipients selected
                    </span>
                    <span className="text-lg font-bold text-purple-900">
                      ₱{recipientStats.estimatedCost.toFixed(2)}
                    </span>
                  </div>

                  {/* Recipient Selection Error */}
                  {errors.recipients && (
                    <p className="text-sm text-red-600">{errors.recipients}</p>
                  )}

                  {/* Warning for Real SMS */}
                  {recipientStats.totalSelected > 0 && (
                    <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                      ⚠️ Real SMS will be sent to {recipientStats.totalSelected} phone numbers. Double-check your message!
                    </div>
                  )}
                </div>
              )}
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
              disabled={isSubmitting || (formData.sendSMS && recipientStats.totalSelected === 0)}
              className="px-8 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating & Sending...</span>
                </>
              ) : (
                <span>
                  {formData.sendSMS && recipientStats.totalSelected > 0
                    ? `Create & Send to ${recipientStats.totalSelected} Students`
                    : 'Create Event'
                  }
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WeekendEventModal;