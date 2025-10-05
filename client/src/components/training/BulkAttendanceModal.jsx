// File: client/src/components/training/BulkAttendanceModal.jsx
// Lines 1-600: Bulk Attendance Tracker for Kids BJJ Training
// Clear line guidance: Handles mass attendance logging with flexible scheduling

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";

const BulkAttendanceModal = ({ 
  isOpen, 
  onClose, 
  students = [],
  onSuccess
}) => {
  const { token } = useAuth();

  // Lines 15-29: Core state management
  const [selectionMode, setSelectionMode] = useState('all'); // 'all' or 'specific'
  const [selectedStudentIds, setSelectedStudentIds] = useState(new Set());
  const [sessionSchedule, setSessionSchedule] = useState('saturday'); // 'mwf', 'saturday', 'sunday'
  const [sessionDate, setSessionDate] = useState('');
  const [sessionType, setSessionType] = useState('WEEKEND');
  const [defaultStatus, setDefaultStatus] = useState('PRESENT');
  const [individualStatuses, setIndividualStatuses] = useState({});
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Lines 31-55: Initialize form when modal opens
  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0=Sunday, 6=Saturday
      
      // Lines 36-42: Smart default schedule detection
      // Saturday (6) or Sunday (0) → weekend default
      // Monday(1), Wednesday(3), Friday(5) → weekday default
      let defaultSchedule = 'saturday';
      let defaultType = 'WEEKEND';
      
      if (dayOfWeek === 0) { // Sunday
        defaultSchedule = 'sunday';
      } else if ([1, 3, 5].includes(dayOfWeek)) { // MWF
        defaultSchedule = 'mwf';
        defaultType = 'WEEKDAY';
      }
      
      setSessionDate(today.toISOString().split('T')[0]);
      setSessionSchedule(defaultSchedule);
      setSessionType(defaultType);
      setSelectionMode('all');
      setSelectedStudentIds(new Set());
      setDefaultStatus('PRESENT');
      setIndividualStatuses({});
      setNotes('');
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Lines 57-66: Update session type when schedule changes
  useEffect(() => {
    if (sessionSchedule === 'mwf') {
      setSessionType('WEEKDAY');
    } else {
      setSessionType('WEEKEND');
    }
  }, [sessionSchedule]);

  // Lines 68-92: Compute students to process based on selection mode
  const studentsToProcess = useMemo(() => {
    const activeStudents = Array.isArray(students) 
      ? students.filter(s => s && s.id && s.name) 
      : [];
    
    if (selectionMode === 'all') {
      return activeStudents;
    }
    
    // Lines 78-90: Filter for specific selection mode
    return activeStudents.filter(s => selectedStudentIds.has(s.id));
  }, [students, selectionMode, selectedStudentIds]);

  // Lines 94-98: Selection summary stats
  const selectionStats = {
    total: Array.isArray(students) ? students.length : 0,
    selected: studentsToProcess.length
  };

  // Lines 100-140: Individual student selection toggle handler
  const handleStudentToggle = (studentId) => {
    setSelectedStudentIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  // Lines 142-165: Individual status override handler
  const handleStatusOverride = (studentId, status) => {
    setIndividualStatuses(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  // Lines 167-181: Select all / deselect all utility
  const handleSelectAll = () => {
    const allIds = Array.isArray(students) 
      ? students.filter(s => s && s.id).map(s => s.id) 
      : [];
    setSelectedStudentIds(new Set(allIds));
  };

  const handleDeselectAll = () => {
    setSelectedStudentIds(new Set());
  };

  // Lines 183-280: Bulk submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Lines 190-195: Validation checks
      if (!sessionDate) {
        throw new Error('Session date is required');
      }

      if (studentsToProcess.length === 0) {
        throw new Error('No students selected. Please select at least one student.');
      }

      if (!token) {
        throw new Error('Authentication required. Please refresh and log in again.');
      }

      // Lines 202-213: Prepare bulk submission data
      const sessionsData = studentsToProcess.map(student => ({
        studentId: student.id,
        sessionType,
        sessionDate,
        attendanceStatus: individualStatuses[student.id] || defaultStatus,
        notes: notes || null
      }));

      console.log(`🥋 Submitting ${sessionsData.length} training sessions`);

      // Lines 215-235: Submit to backend (individual API calls for now)
      const results = await Promise.allSettled(
        sessionsData.map(sessionData => 
          fetch('/api/training-sessions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(sessionData)
          }).then(res => {
            if (!res.ok) throw new Error(`Failed for student ${sessionData.studentId}`);
            return res.json();
          })
        )
      );

      // Lines 237-252: Analyze results
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      console.log(`✅ Bulk attendance: ${successful} successful, ${failed} failed`);

      if (failed > 0) {
        throw new Error(`Partial success: ${successful} logged, ${failed} failed. Check console for details.`);
      }

      // Lines 254-260: Success handling
      if (onSuccess) {
        onSuccess(`Successfully logged ${successful} training sessions`);
      }

      onClose();

    } catch (err) {
      console.error('❌ Bulk attendance error:', err);
      setError(err.message || 'Failed to log attendance');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Lines 282-285: Early return if modal closed
  if (!isOpen) return null;

  // Lines 287-600: Main UI Render
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl max-h-[95vh] overflow-y-auto border border-gray-700 my-4">
        
        {/* Lines 291-315: Modal Header */}
        <div className="sticky top-0 bg-gray-800 z-10 flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🥋</span>
            <div>
              <h2 className="text-xl font-semibold text-white">
                Bulk Attendance Tracker
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {selectionStats.selected} of {selectionStats.total} students selected
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-700"
            disabled={isSubmitting}
          >
            <span className="text-xl">✕</span>
          </button>
        </div>

        {/* Lines 317-600: Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Lines 320-330: Error Display */}
          {error && (
            <div className="bg-red-600 bg-opacity-20 border border-red-600 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <span className="text-red-400">⚠️</span>
                <p className="text-red-400 text-sm font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Lines 332-400: Session Configuration Section */}
          <div className="bg-gray-750 rounded-lg p-6 border border-gray-600 space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Session Configuration</h3>
            
            {/* Lines 337-355: Date & Schedule Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Session Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={isSubmitting}
                />
              </div>
              
              {/* Lines 357-395: Schedule Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Training Schedule <span className="text-red-400">*</span>
                </label>
                <div className="space-y-2">
                  <label className="flex items-center p-3 bg-gray-700 border border-gray-600 rounded-lg cursor-pointer hover:bg-gray-650">
                    <input
                      type="radio"
                      value="mwf"
                      checked={sessionSchedule === 'mwf'}
                      onChange={(e) => setSessionSchedule(e.target.value)}
                      className="mr-3"
                      disabled={isSubmitting}
                    />
                    <span className="text-white">MWF Weekday Sessions</span>
                  </label>
                  <label className="flex items-center p-3 bg-gray-700 border border-gray-600 rounded-lg cursor-pointer hover:bg-gray-650">
                    <input
                      type="radio"
                      value="saturday"
                      checked={sessionSchedule === 'saturday'}
                      onChange={(e) => setSessionSchedule(e.target.value)}
                      className="mr-3"
                      disabled={isSubmitting}
                    />
                    <span className="text-white">Saturday Session</span>
                  </label>
                  <label className="flex items-center p-3 bg-gray-700 border border-gray-600 rounded-lg cursor-pointer hover:bg-gray-650">
                    <input
                      type="radio"
                      value="sunday"
                      checked={sessionSchedule === 'sunday'}
                      onChange={(e) => setSessionSchedule(e.target.value)}
                      className="mr-3"
                      disabled={isSubmitting}
                    />
                    <span className="text-white">Sunday Session</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Lines 397-415: Default Attendance Status */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Default Attendance Status
              </label>
              <select
                value={defaultStatus}
                onChange={(e) => setDefaultStatus(e.target.value)}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                <option value="PRESENT">Present (Full Participation)</option>
                <option value="LATE">Late Arrival</option>
                <option value="LEFT_EARLY">Left Early</option>
                <option value="ABSENT">Absent</option>
              </select>
            </div>

            {/* Lines 417-430: Session Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Session Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                placeholder="General notes for this session..."
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Lines 432-545: Student Selection Section */}
          <div className="bg-gray-750 rounded-lg p-6 border border-gray-600 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Student Selection</h3>
              
              {/* Lines 438-465: Selection Mode Toggle */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectionMode('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectionMode === 'all' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  disabled={isSubmitting}
                >
                  All Students
                </button>
                <button
                  type="button"
                  onClick={() => setSelectionMode('specific')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectionMode === 'specific' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  disabled={isSubmitting}
                >
                  Select Specific
                </button>
              </div>
            </div>

            {/* Lines 467-487: Quick Select Buttons (only in specific mode) */}
            {selectionMode === 'specific' && (
              <div className="flex gap-3 pb-4 border-b border-gray-600">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                  disabled={isSubmitting}
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors"
                  disabled={isSubmitting}
                >
                  Deselect All
                </button>
              </div>
            )}

            {/* Lines 489-545: Student List */}
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {Array.isArray(students) && students.length > 0 ? (
                students
                  .filter(s => s && s.id && s.name)
                  .map(student => {
                    const isSelected = selectionMode === 'all' || selectedStudentIds.has(student.id);
                    const currentStatus = individualStatuses[student.id] || defaultStatus;
                    
                    return (
                      <div
                        key={student.id}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-900 bg-opacity-20'
                            : 'border-gray-600 bg-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          {/* Lines 507-525: Student Info & Checkbox */}
                          <div className="flex items-center gap-3 flex-1">
                            {selectionMode === 'specific' && (
                              <input
                                type="checkbox"
                                checked={selectedStudentIds.has(student.id)}
                                onChange={() => handleStudentToggle(student.id)}
                                className="w-5 h-5 rounded"
                                disabled={isSubmitting}
                              />
                            )}
                            <div>
                              <p className="text-white font-medium">{student.name}</p>
                              <p className="text-gray-400 text-sm">{student.email}</p>
                            </div>
                          </div>

                          {/* Lines 527-543: Individual Status Override */}
                          <select
                            value={currentStatus}
                            onChange={(e) => handleStatusOverride(student.id, e.target.value)}
                            className={`px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              !isSelected ? 'opacity-50' : ''
                            }`}
                            disabled={isSubmitting || !isSelected}
                          >
                            <option value="PRESENT">Present</option>
                            <option value="LATE">Late</option>
                            <option value="LEFT_EARLY">Left Early</option>
                            <option value="ABSENT">Absent</option>
                          </select>
                        </div>
                      </div>
                    );
                  })
              ) : (
                <div className="text-center py-8 text-gray-400">
                  No students available
                </div>
              )}
            </div>
          </div>

          {/* Lines 547-580: Action Buttons */}
          <div className="sticky bottom-0 bg-gray-800 pt-4 border-t border-gray-700 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
                isSubmitting || studentsToProcess.length === 0
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
              disabled={isSubmitting || studentsToProcess.length === 0}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Processing...
                </span>
              ) : (
                `Log Attendance for ${studentsToProcess.length} Student${studentsToProcess.length !== 1 ? 's' : ''}`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkAttendanceModal;