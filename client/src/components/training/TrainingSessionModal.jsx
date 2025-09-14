// File: client/src/components/training/TrainingSessionModal.jsx
// Lines 1-50: Training Session Modal Component - Follows existing modal patterns
import React, { useState, useEffect } from "react";

/**
 * TrainingSessionModal Component
 * 
 * Modal for logging martial arts training sessions with comprehensive form handling
 * Follows existing modal patterns from WeekendEventModal for consistency
 * 
 * Props:
 * - isOpen: Boolean to control modal visibility
 * - onClose: Function to close modal
 * - students: Array of all students for selection dropdown
 * - selectedStudent: Pre-selected student object (optional)
 * - onSuccess: Callback function for successful submission
 */
const TrainingSessionModal = ({ 
  isOpen, 
  onClose, 
  students = [], 
  onSuccess,
  selectedStudent = null 
}) => {
  // Lines 25-45: Form state management
  const [formData, setFormData] = useState({
    studentId: '',
    sessionType: 'WEEKEND',
    sessionDate: '',
    duration: 90,
    attendanceStatus: 'PRESENT',
    skillsWorkedOn: [],
    notes: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Lines 46-60: Available martial arts skills for selection
  const availableSkills = [
    'Basic Stances',
    'Kicks', 
    'Punches',
    'Blocks',
    'Forms/Patterns',
    'Sparring',
    'Self-Defense',
    'Flexibility',
    'Conditioning',
    'Discipline'
  ];

  // Lines 61-80: Reset form when modal opens/closes or student changes
  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0];
      
      setFormData({
        studentId: selectedStudent?.id || '',
        sessionType: 'WEEKEND',
        sessionDate: today,
        duration: 90,
        attendanceStatus: 'PRESENT',
        skillsWorkedOn: [],
        notes: ''
      });
      
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen, selectedStudent]);

  // Lines 85-140: Form submission handler
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
      today.setHours(23, 59, 59, 999); // End of today
      
      if (sessionDate > today) {
        throw new Error('Session date cannot be in the future');
      }

      // Prepare submission data
      const submissionData = {
        ...formData,
        studentId: parseInt(formData.studentId),
        duration: parseInt(formData.duration),
        skillsWorkedOn: formData.skillsWorkedOn.filter(skill => skill.trim())
      };

      // API call to training sessions endpoint
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      const response = await fetch('/api/training-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submissionData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Server error: ${response.status}`);
      }

      // Success handling
      console.log('Training session logged successfully:', result.data);
      
      const studentName = result.data?.student?.name || 
                          students.find(s => s.id === parseInt(formData.studentId))?.name || 
                          'Student';
      
      if (onSuccess) {
        onSuccess(`Training session logged for ${studentName}`);
      }
      
      onClose();

    } catch (err) {
      console.error('Failed to log training session:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Lines 145-160: Skill selection toggle handler
  const handleSkillToggle = (skill) => {
    setFormData(prev => ({
      ...prev,
      skillsWorkedOn: prev.skillsWorkedOn.includes(skill)
        ? prev.skillsWorkedOn.filter(s => s !== skill)
        : [...prev.skillsWorkedOn, skill]
    }));
  };

  // Lines 165-175: Generic input change handler
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Lines 180-185: Early return if modal is closed
  if (!isOpen) return null;

  // Lines 190-550: Modal UI with dark theme matching existing components
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
                max={new Date().toISOString().split('T')[0]} // Prevent future dates
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

          {/* Duration and Attendance Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Duration (minutes)
              </label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', Math.max(15, parseInt(e.target.value) || 15))}
                min="15"
                max="180"
                step="15"
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500 mt-1">
                Default: 90 minutes (weekend sessions)
              </p>
            </div>

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
          </div>

          {/* Skills Worked On */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Skills Worked On
              <span className="text-xs text-gray-500 ml-2">(Select all that apply)</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {availableSkills.map(skill => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => handleSkillToggle(skill)}
                  disabled={isSubmitting}
                  className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 border ${
                    formData.skillsWorkedOn.includes(skill)
                      ? 'bg-blue-600 text-white border-blue-600 shadow-lg'
                      : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600 hover:border-gray-500'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {formData.skillsWorkedOn.includes(skill) && (
                    <span className="mr-2">✓</span>
                  )}
                  {skill}
                </button>
              ))}
            </div>
            {formData.skillsWorkedOn.length > 0 && (
              <p className="text-xs text-blue-400 mt-2">
                Selected {formData.skillsWorkedOn.length} skill{formData.skillsWorkedOn.length !== 1 ? 's' : ''}
              </p>
            )}
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
              disabled={isSubmitting || !formData.studentId || !formData.sessionDate}
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