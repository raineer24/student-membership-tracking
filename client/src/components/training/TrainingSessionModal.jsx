// File: client/src/components/training/TrainingSessionModal.jsx
// FIXED: Authentication token issue - now uses useAuth hook properly
import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

const TrainingSessionModal = ({ 
  isOpen, 
  onClose, 
  students = [], 
  onSuccess,
  selectedStudent = null 
}) => {
  // FIXED: Get token from useAuth hook instead of localStorage
  const { token } = useAuth();
  
  const [formData, setFormData] = useState({
    studentId: '',
    sessionType: 'WEEKEND',
    sessionDate: '',
    attendanceStatus: 'PRESENT',
    notes: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0];
      
      setFormData({
        studentId: selectedStudent?.id || '',
        sessionType: 'WEEKEND',
        sessionDate: today,
        attendanceStatus: 'PRESENT',
        notes: ''
      });
      
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen, selectedStudent]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Client-side validation
      if (!formData.studentId || !formData.sessionDate) {
        throw new Error('Student and session date are required');
      }

      // Validate session date is not in future beyond today
      const sessionDate = new Date(formData.sessionDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      
      if (sessionDate > today) {
        throw new Error('Session date cannot be in the future');
      }

      // FIXED: Better token validation
      if (!token) {
        throw new Error('You are not logged in. Please refresh the page and try again.');
      }

      // Prepare submission data with default duration
      const submissionData = {
        ...formData,
        studentId: parseInt(formData.studentId),
        duration: 90, // Default duration, not exposed in UI
        skillsWorkedOn: [] // Empty array, not exposed in UI
      };

      console.log('🥋 Submitting training session:', submissionData);

      // FIXED: Use token from useAuth hook
      const response = await fetch('/api/training-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submissionData)
      });

      console.log('🥋 Response status:', response.status);

      // FIXED: Better error handling for different response codes
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Your session has expired. Please refresh the page and log in again.');
        } else if (response.status === 403) {
          throw new Error('You do not have permission to log training sessions.');
        } else if (response.status === 500) {
          throw new Error('Server error. Please try again later.');
        }
        
        // Try to get error message from response
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
        } catch (parseError) {
          throw new Error(`Server error: ${response.status}. Please try again.`);
        }
      }

      const result = await response.json();
      console.log('🥋 Training session logged successfully:', result);

      // Success handling
      const studentName = result.data?.student?.name || 
                          students.find(s => s.id === parseInt(formData.studentId))?.name || 
                          'Student';
      
      if (onSuccess) {
        onSuccess(`Training session logged for ${studentName}`);
      }
      
      onClose();

    } catch (err) {
      console.error('❌ Failed to log training session:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center">
            <span className="text-2xl mr-3">🥋</span>
            <div>
              <h2 className="text-xl font-semibold text-white">
                Log Training Session
              </h2>
              {selectedStudent && (
                <p className="text-sm text-gray-400 mt-1">
                  for {selectedStudent.name}
                </p>
              )}
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-700"
            disabled={isSubmitting}
            title="Close modal"
          >
            <span className="text-xl">✕</span>
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Error Display */}
          {error && (
            <div className="bg-red-600 bg-opacity-20 border border-red-600 rounded-lg p-4">
              <div className="flex items-center">
                <span className="text-red-400 mr-2">⚠️</span>
                <p className="text-red-400 text-sm font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Token Status Debug Info - Remove in production */}
          {!token && (
            <div className="bg-yellow-600 bg-opacity-20 border border-yellow-600 rounded-lg p-4">
              <div className="flex items-center">
                <span className="text-yellow-400 mr-2">⚠️</span>
                <p className="text-yellow-400 text-sm font-medium">
                  Authentication token missing. Please refresh the page and log in again.
                </p>
              </div>
            </div>
          )}

          {/* Student Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Student <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.studentId}
              onChange={(e) => handleInputChange('studentId', e.target.value)}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              required
              disabled={selectedStudent || isSubmitting}
            >
              <option value="">Select a student...</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.name} - {student.email}
                </option>
              ))}
            </select>
            {selectedStudent && (
              <p className="text-xs text-gray-500 mt-1">
                Pre-selected from student card
              </p>
            )}
          </div>

          {/* Session Date and Type Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Session Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={formData.sessionDate}
                onChange={(e) => handleInputChange('sessionDate', e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Session Type
              </label>
              <select
                value={formData.sessionType}
                onChange={(e) => handleInputChange('sessionType', e.target.value)}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                disabled={isSubmitting}
              >
                <option value="WEEKEND">Weekend (Primary Schedule)</option>
                <option value="WEEKDAY">Weekday (MWF Sessions)</option>
                <option value="TRIAL">Trial Session</option>
                <option value="MAKEUP">Makeup Session</option>
              </select>
            </div>
          </div>

          {/* Attendance Status - Full Width */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Attendance Status
            </label>
            <select
              value={formData.attendanceStatus}
              onChange={(e) => handleInputChange('attendanceStatus', e.target.value)}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              disabled={isSubmitting}
            >
              <option value="PRESENT">Present (Full Participation)</option>
              <option value="LATE">Late Arrival</option>
              <option value="LEFT_EARLY">Left Early</option>
              <option value="ABSENT">Absent</option>
            </select>
          </div>

          {/* Session Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Session Notes
              <span className="text-xs text-gray-500 ml-2">(Optional)</span>
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows="4"
              maxLength="500"
              placeholder="Optional notes about student progress, behavior, techniques practiced, areas for improvement, etc..."
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
              disabled={isSubmitting}
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-gray-500">
                Notes help track student progress over time
              </p>
              <p className="text-xs text-gray-500">
                {formData.notes.length}/500
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-3 text-gray-300 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={isSubmitting || !formData.studentId || !formData.sessionDate || !token}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-medium min-w-[140px] justify-center"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Logging...</span>
                </>
              ) : (
                <>
                  <span>🥋</span>
                  <span>Log Session</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TrainingSessionModal;