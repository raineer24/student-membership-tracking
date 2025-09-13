// File: client/src/components/modals/TrainingSessionModal.jsx
// Lines 1-200: NEW Training Session Logging Modal for 30+ Day Tracking

import React, { useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";

// Lines 10-50: Training Session Modal Component
const TrainingSessionModal = ({ 
  isOpen, 
  onClose, 
  student, 
  onSessionLogged 
}) => {
  const { token } = useAuth();
  const { showSuccess, showError } = useToast();

  // Form state management
  const [formData, setFormData] = useState({
    sessionType: "Weekend",
    dayOfWeek: "Saturday",
    timeSlot: "10:00am-11:30am",
    date: new Date().toISOString().split('T')[0],
    attendance: "Present",
    notes: ""
  });

  const [loading, setLoading] = useState(false);

  // Lines 30-60: Form handlers
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-update time slot based on session type
    if (field === "sessionType") {
      if (value === "Weekend") {
        setFormData(prev => ({
          ...prev,
          timeSlot: "10:00am-11:30am",
          dayOfWeek: "Saturday"
        }));
      } else if (value === "MWF-Weekday") {
        setFormData(prev => ({
          ...prev,
          timeSlot: "4:00pm-5:00pm",
          dayOfWeek: "Monday"
        }));
      }
    }
  }, []);

  // Lines 65-100: Submit handler with API integration
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!student?.id) {
      showError("Student information is missing");
      return;
    }

    setLoading(true);

    try {
      const sessionData = {
        ...formData,
        studentId: student.id,
        duration: formData.sessionType === "Weekend" ? 90 : 60
      };

      const response = await fetch('/api/training-sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to log training session');
      }

      const result = await response.json();
      
      showSuccess(`Training session logged for ${student.name}!`);
      
      if (onSessionLogged) {
        onSessionLogged(result.data);
      }
      
      onClose();
      
      // Reset form
      setFormData({
        sessionType: "Weekend",
        dayOfWeek: "Saturday", 
        timeSlot: "10:00am-11:30am",
        date: new Date().toISOString().split('T')[0],
        attendance: "Present",
        notes: ""
      });

    } catch (error) {
      console.error("Training session logging error:", error);
      showError(`Failed to log training session: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [formData, student, token, showSuccess, showError, onSessionLogged, onClose]);

  // Don't render if modal is closed
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">
            Log Training Session
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={loading}
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Student Info */}
        {student && (
          <div className="px-6 py-3 bg-gray-900 border-b border-gray-700">
            <p className="text-sm text-gray-300">
              Student: <span className="text-white font-medium">{student.name}</span>
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Session Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Session Type
            </label>
            <select
              value={formData.sessionType}
              onChange={(e) => handleInputChange("sessionType", e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="Weekend">Weekend Session</option>
              <option value="MWF-Weekday">MWF Weekday Session</option>
            </select>
          </div>

          {/* Day of Week */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Day of Week
            </label>
            <select
              value={formData.dayOfWeek}
              onChange={(e) => handleInputChange("dayOfWeek", e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              {formData.sessionType === "Weekend" ? (
                <>
                  <option value="Saturday">Saturday</option>
                  <option value="Sunday">Sunday</option>
                </>
              ) : (
                <>
                  <option value="Monday">Monday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Friday">Friday</option>
                </>
              )}
            </select>
          </div>

          {/* Time Slot */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Time Slot
            </label>
            <select
              value={formData.timeSlot}
              onChange={(e) => handleInputChange("timeSlot", e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              {formData.sessionType === "Weekend" ? (
                <option value="10:00am-11:30am">10:00am-11:30am (90 min)</option>
              ) : (
                <>
                  <option value="4:00pm-5:00pm">4:00pm-5:00pm (60 min)</option>
                  <option value="5:00pm-6:00pm">5:00pm-6:00pm (60 min)</option>
                  <option value="6:00pm-7:00pm">6:00pm-7:00pm (60 min)</option>
                </>
              )}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Session Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange("date", e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
              required
            />
          </div>

          {/* Attendance Status */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Attendance
            </label>
            <select
              value={formData.attendance}
              onChange={(e) => handleInputChange("attendance", e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Late">Late</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Additional notes about the session..."
              disabled={loading}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 inline-block"></div>
                  Logging...
                </>
              ) : (
                'Log Session'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TrainingSessionModal;