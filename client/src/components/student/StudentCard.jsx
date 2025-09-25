// File: client/src/components/student/StudentCard.jsx
// Lines 1-120: Mobile card component extracted from StudentManagementSection
import React from 'react';
import { normalizeStudentData, createSafeHandler } from '../../utils/studentTableUtils';
import StudentStatusDisplay from './StudentStatusDisplay';

/**
 * StudentCard Component
 * Mobile-optimized card layout for student information
 * Lines 10-15: Component props interface
 */
const StudentCard = ({ 
  student, 
  onProcessPayment, 
  onViewStudent, 
  onEditStudent, 
  onSendReminder, 
  onLogTraining,
  canSendReminder, 
  smsLoading,
  getStudentStatus,
  getDaysRemaining
}) => {
  if (!student || typeof student !== 'object') {
    return null;
  }

  // Lines 25-30: Use Phase 1 utilities
  const studentData = normalizeStudentData(student);
  const { name, email, phone, monthlyRate } = studentData;

  // Lines 32-37: Status calculations
  const status = getStudentStatus ? getStudentStatus(student) : 'inactive';
  const daysText = getDaysRemaining ? getDaysRemaining(student) : 'Unknown';
  const canSendSMS = canSendReminder ? canSendReminder(student) : false;

  // Lines 39-47: Safe event handlers
  const handleEditClick = createSafeHandler(
    () => onEditStudent(student), 
    'Mobile Edit - onEditStudent'
  );

  const handleTrainingClick = createSafeHandler(
    () => onLogTraining(student), 
    'Mobile Training - onLogTraining'
  );

  return (
    <div className="bg-gray-750 rounded-xl p-5 border border-gray-600 shadow-lg">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-base truncate">{name}</h3>
            <p className="text-gray-400 text-sm truncate">{email}</p>
            <p className="text-gray-400 text-sm">{phone}</p>
          </div>
        </div>
        
        <div className="flex-shrink-0 text-right space-y-1">
          <StudentStatusDisplay 
            status={status} 
            student={student} 
            showLegacy={true}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Rate</p>
          <p className="text-white font-semibold">₱{monthlyRate.toLocaleString()}</p>
          <p className="text-gray-400 text-xs">per month</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Due Date</p>
          <p className="text-sm font-medium text-gray-300">{daysText}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => onViewStudent && onViewStudent(student.id)}
            className="flex flex-col items-center justify-center py-3 px-1 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-medium rounded-lg transition-all duration-200 min-h-[52px] transform active:scale-95"
          >
            <span className="text-lg mb-1">👁️</span>
            <span>View</span>
          </button>
          
          <button
            onClick={handleEditClick}
            className="flex flex-col items-center justify-center py-3 px-1 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-xs font-medium rounded-lg transition-all duration-200 min-h-[52px] transform active:scale-95"
          >
            <span className="text-lg mb-1">✏️</span>
            <span>Edit</span>
          </button>
          
          <button
            onClick={() => onProcessPayment && onProcessPayment(student)}
            className="flex flex-col items-center justify-center py-3 px-1 bg-yellow-600 hover:bg-yellow-700 active:bg-yellow-800 text-white text-xs font-medium rounded-lg transition-all duration-200 min-h-[52px] transform active:scale-95"
          >
            <span className="text-lg mb-1">💳</span>
            <span>Pay</span>
          </button>

          <button
            onClick={handleTrainingClick}
            className="flex flex-col items-center justify-center py-3 px-1 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white text-xs font-medium rounded-lg transition-all duration-200 min-h-[52px] transform active:scale-95"
          >
            <span className="text-lg mb-1">🥋</span>
            <span>Training</span>
          </button>
        </div>
        
        {canSendSMS && (
          <button
            onClick={() => onSendReminder && onSendReminder(student)}
            disabled={smsLoading}
            className="w-full flex items-center justify-center py-3 px-4 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-sm font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-[52px] transform active:scale-95"
          >
            <span className="mr-2 text-lg">{smsLoading ? "⏳" : "📱"}</span>
            <span>{smsLoading ? "Sending SMS..." : "Send SMS Reminder"}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default StudentCard;