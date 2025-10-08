// File: client/src/components/training/BulkAttendanceModal.jsx
// COMPLETE ENHANCED VERSION: Search filter + Duplicate prevention
// Lines 1-680: Full bulk attendance tracker with all features

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";

const BulkAttendanceModal = ({ 
  isOpen, 
  onClose, 
  students = [],
  onSuccess
}) => {
  const { token } = useAuth();

  // Lines 15-31: Core state management (ENHANCED)
  const [selectionMode, setSelectionMode] = useState('all');
  const [selectedStudentIds, setSelectedStudentIds] = useState(new Set());
  const [sessionSchedule, setSessionSchedule] = useState('saturday');
  const [sessionDate, setSessionDate] = useState('');
  const [sessionType, setSessionType] = useState('WEEKEND');
  const [defaultStatus, setDefaultStatus] = useState('PRESENT');
  const [individualStatuses, setIndividualStatuses] = useState({});
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState(''); // NEW: Search functionality
  const [duplicateInfo, setDuplicateInfo] = useState(null); // NEW: Duplicate tracking

  // Lines 33-59: Initialize form when modal opens
  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      const dayOfWeek = today.getDay();
      
      let defaultSchedule = 'saturday';
      let defaultType = 'WEEKEND';
      
      if (dayOfWeek === 0) {
        defaultSchedule = 'sunday';
      } else if ([1, 3, 5].includes(dayOfWeek)) {
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
      setSearchTerm('');
      setDuplicateInfo(null);
    }
  }, [isOpen]);

  // Lines 61-70: Update session type when schedule changes
  useEffect(() => {
    if (sessionSchedule === 'mwf') {
      setSessionType('WEEKDAY');
    } else {
      setSessionType('WEEKEND');
    }
  }, [sessionSchedule]);

  // Lines 72-97: NEW - Filter students by search term
  const filteredStudents = useMemo(() => {
    const activeStudents = Array.isArray(students) 
      ? students.filter(s => s && s.id && s.name) 
      : [];
    
    if (!searchTerm.trim()) {
      return activeStudents;
    }
    
    const searchLower = searchTerm.toLowerCase().trim();
    return activeStudents.filter(student => {
      const name = (student.name || '').toLowerCase();
      const email = (student.email || '').toLowerCase();
      const phone = (student.phone || '').toLowerCase();
      
      return name.includes(searchLower) || 
             email.includes(searchLower) || 
             phone.includes(searchLower);
    });
  }, [students, searchTerm]);

  // Lines 99-112: Compute students to process (UPDATED to use filteredStudents)
  const studentsToProcess = useMemo(() => {
    if (selectionMode === 'all') {
      return filteredStudents;
    }
    
    return filteredStudents.filter(s => selectedStudentIds.has(s.id));
  }, [filteredStudents, selectionMode, selectedStudentIds]);

  // Lines 114-120: Selection summary stats (UPDATED)
  const selectionStats = {
    total: filteredStudents.length,
    totalUnfiltered: Array.isArray(students) ? students.length : 0,
    selected: studentsToProcess.length
  };

  // Lines 122-137: Individual student selection toggle
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

  // Lines 139-144: Individual status override
  const handleStatusOverride = (studentId, status) => {
    setIndividualStatuses(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  // Lines 146-155: Select all / deselect all (UPDATED to use filteredStudents)
  const handleSelectAll = () => {
    const allIds = filteredStudents.map(s => s.id);
    setSelectedStudentIds(new Set(allIds));
  };

  const handleDeselectAll = () => {
    setSelectedStudentIds(new Set());
  };

  // Lines 157-290: ENHANCED - Bulk submission with duplicate detection
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setDuplicateInfo(null);

    try {
      if (!sessionDate) {
        throw new Error('Session date is required');
      }

      if (studentsToProcess.length === 0) {
        throw new Error('No students selected');
      }

      if (!token) {
        throw new Error('Authentication required');
      }

      const sessionsData = studentsToProcess.map(student => ({
        studentId: student.id,
        studentName: student.name, // For error reporting
        sessionType,
        sessionDate,
        attendanceStatus: individualStatuses[student.id] || defaultStatus,
        notes: notes || null
      }));

      console.log(`🥋 Submitting ${sessionsData.length} training sessions`);

      // Submit all sessions with duplicate detection
      const results = await Promise.allSettled(
        sessionsData.map(sessionData => 
          fetch('/api/training-sessions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              studentId: sessionData.studentId,
              sessionType: sessionData.sessionType,
              sessionDate: sessionData.sessionDate,
              attendanceStatus: sessionData.attendanceStatus,
              notes: sessionData.notes
            })
          }).then(async res => {
            const data = await res.json();
            
            // Handle duplicate error (409 status)
            if (res.status === 409 && data.duplicate) {
              return { 
                ...data, 
                studentId: sessionData.studentId,
                studentName: sessionData.studentName,
                isDuplicate: true 
              };
            }
            
            // Handle other errors
            if (!res.ok) {
              throw new Error(data.message || `Failed for ${sessionData.studentName}`);
            }
            
            return { ...data, studentName: sessionData.studentName };
          })
        )
      );

      // Analyze results
      const successful = results.filter(r => r.status === 'fulfilled' && !r.value.isDuplicate).length;
      const failed = results.filter(r => r.status === 'rejected').length;
      const duplicates = results.filter(r => r.status === 'fulfilled' && r.value.isDuplicate);

      console.log(`✅ Results: ${successful} successful, ${failed} failed, ${duplicates.length} duplicates`);

      // Handle duplicates
      if (duplicates.length > 0) {
        const duplicateDetails = duplicates.map(d => ({
          studentName: d.value.studentName,
          existingSession: d.value.existingSession
        }));

        setDuplicateInfo({
          count: duplicates.length,
          details: duplicateDetails
        });

        // Show appropriate message
        if (successful > 0) {
          setError(`Logged ${successful} new session(s). ${duplicates.length} student(s) already have sessions on this date.`);
        } else {
          setError(`All ${duplicates.length} student(s) already have sessions on ${sessionDate}. No new sessions created.`);
        }
        
        // Don't close modal so user can see duplicate info
        return;
      }

      // Handle failures
      if (failed > 0) {
        throw new Error(`Partial success: ${successful} logged, ${failed} failed`);
      }

      // All successful - close modal
      if (onSuccess) {
        onSuccess(`Successfully logged ${successful} training session${successful !== 1 ? 's' : ''}`);
      }
      onClose();

    } catch (err) {
      console.error('❌ Bulk attendance error:', err);
      setError(err.message || 'Failed to log attendance');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Lines 292-680: Main UI Render
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl max-h-[95vh] overflow-y-auto border border-gray-700 my-4">
        
        {/* Lines 296-321: Modal Header */}
        <div className="sticky top-0 bg-gray-800 z-10 flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🥋</span>
            <div>
              <h2 className="text-xl font-semibold text-white">
                Bulk Attendance Tracker
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {selectionStats.selected} of {selectionStats.total} students selected
                {searchTerm && ` (filtered from ${selectionStats.totalUnfiltered})`}
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

        {/* Form Content */}
        <div className="p-6 space-y-6">
          
          {/* Lines 327-355: NEW - Duplicate Warning */}
          {duplicateInfo && (
            <div className="bg-yellow-900 bg-opacity-20 border border-yellow-600 rounded-lg p-4">
              <div className="flex items-start gap-2 mb-3">
                <span className="text-yellow-400 text-xl">⚠️</span>
                <div className="flex-1">
                  <p className="text-yellow-400 font-medium">Duplicate Sessions Detected</p>
                  <p className="text-yellow-300 text-sm mt-1">
                    {duplicateInfo.count} student(s) already have training sessions on {sessionDate}
                  </p>
                </div>
              </div>
              <div className="ml-7 space-y-2">
                {duplicateInfo.details.map((d, idx) => (
                  <div key={idx} className="bg-yellow-950 bg-opacity-30 rounded p-2">
                    <p className="text-yellow-200 text-sm font-medium">
                      {d.studentName}
                    </p>
                    <p className="text-yellow-300 text-xs mt-1">
                      Existing: {d.existingSession.type} - {d.existingSession.status}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-yellow-300 text-sm mt-3 ml-7 italic">
                💡 To fix: Go to student profile → Delete existing session → Try again
              </p>
            </div>
          )}

          {/* Lines 357-367: Error Display */}
          {error && !duplicateInfo && (
            <div className="bg-red-600 bg-opacity-20 border border-red-600 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <span className="text-red-400">⚠️</span>
                <p className="text-red-400 text-sm font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Lines 369-475: Session Configuration Section */}
          <div className="bg-gray-750 rounded-lg p-6 border border-gray-600 space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Session Configuration</h3>
            
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

          {/* Lines 477-625: Student Selection Section with Search */}
          <div className="bg-gray-750 rounded-lg p-6 border border-gray-600 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Student Selection</h3>
              
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

            {/* Lines 510-540: NEW - Search Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Search Students
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter by name, email, or phone..."
                  className="w-full p-3 pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  🔍
                </span>
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Lines 542-562: Quick Select Buttons */}
            {selectionMode === 'specific' && (
              <div className="flex gap-3 pb-4 border-b border-gray-600">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                  disabled={isSubmitting}
                >
                  Select All {searchTerm && `(${filteredStudents.length})`}
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

            {/* Lines 564-625: Student List */}
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {filteredStudents.length > 0 ? (
                filteredStudents.map(student => {
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
                  {searchTerm 
                    ? `No students found matching "${searchTerm}"`
                    : 'No students available'
                  }
                </div>
              )}
            </div>
          </div>

          {/* Lines 627-668: Action Buttons */}
          <div className="sticky bottom-0 bg-gray-800 pt-4 border-t border-gray-700 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium"
              disabled={isSubmitting}
            >
              {duplicateInfo ? 'Close' : 'Cancel'}
            </button>
            
            <button
              type="button"
              onClick={handleSubmit}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
                isSubmitting || studentsToProcess.length === 0
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : duplicateInfo
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
              disabled={isSubmitting || studentsToProcess.length === 0}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Processing...
                </span>
              ) : duplicateInfo ? (
                `Retry (${studentsToProcess.length} student${studentsToProcess.length !== 1 ? 's' : ''})`
              ) : (
                `Log Attendance for ${studentsToProcess.length} Student${studentsToProcess.length !== 1 ? 's' : ''}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkAttendanceModal;