// File: client/src/components/student/StudentTableRow.jsx
// Lines 1-25: Aligned with Phase 1 utilities
import React from 'react';
import { normalizeStudentData, createSafeHandler } from '../../utils/studentTableUtils';
import { getStatusConfig } from '../../utils/studentStatusConfig';
import StudentStatusDisplay from './StudentStatusDisplay';

/**
 * StudentTableRow Component - Phase 1 Aligned
 * Renders individual student table row using extracted utilities
 * REMOVED: Inline utilities, embedded status logic, duplicate date calculations
 */
const StudentTableRow = ({ 
  student, 
  onProcessPayment, 
  onViewStudent, 
  onEditStudent, 
  onSendReminder, 
  onLogTraining, // ADDED: Training integration
  canSendReminder, 
  smsLoading,
  getStudentStatus,
  getDaysRemaining
}) => {
  if (!student || typeof student !== 'object') {
    return null;
  }

  // Lines 30-35: Use Phase 1 utilities (not inline functions)
  const studentData = normalizeStudentData(student);
  const { name, email, phone, monthlyRate } = studentData;

  // Lines 37-42: Status calculations using passed functions
  const status = getStudentStatus ? getStudentStatus(student) : 'inactive';
  const daysText = getDaysRemaining ? getDaysRemaining(student) : 'Unknown';
  const canSendSMS = canSendReminder ? canSendReminder(student) : false;

  // Lines 44-52: Safe event handlers using Phase 1 utilities
  const handleEditClick = createSafeHandler(
    () => onEditStudent(student), 
    'Desktop Edit - onEditStudent'
  );

  const handleTrainingClick = createSafeHandler(
    () => onLogTraining(student), 
    'Desktop Training - onLogTraining'
  );

  return (
    <tr className="hover:bg-gray-750 transition-colors duration-200">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-12 w-12">
            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
              {name.charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-semibold text-white">{name}</div>
            <div className="text-sm text-gray-400">{email}</div>
            <div className="text-xs text-gray-500">📞 {phone}</div>
          </div>
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <StudentStatusDisplay 
          status={status} 
          student={student} 
          showLegacy={true}
        />
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-white">MONTHLY</div>
        <div className="text-lg font-bold text-white">
          ₱{monthlyRate.toLocaleString()}/mo
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm font-medium text-gray-300">
          {daysText}
        </span>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center justify-end space-x-2">
          <button
            onClick={() => onViewStudent && onViewStudent(student.id)}
            className="text-blue-400 hover:text-blue-300 p-2 rounded-lg hover:bg-gray-700 transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="View Student Details"
          >
            <span className="text-lg">👁️</span>
          </button>
          
          <button
            onClick={handleEditClick}
            className="text-green-400 hover:text-green-300 p-2 rounded-lg hover:bg-gray-700 transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Edit Student Information"
          >
            <span className="text-lg">✏️</span>
          </button>
          
          <button
            onClick={() => onProcessPayment && onProcessPayment(student)}
            className="text-yellow-400 hover:text-yellow-300 p-2 rounded-lg hover:bg-gray-700 transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Process Payment"
          >
            <span className="text-lg">💳</span>
          </button>

          <button
            onClick={handleTrainingClick}
            className="text-orange-400 hover:text-orange-300 p-2 rounded-lg hover:bg-gray-700 transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Log Training Session"
          >
            <span className="text-lg">🥋</span>
          </button>
          
          {canSendSMS && (
            <button
              onClick={() => onSendReminder && onSendReminder(student)}
              disabled={smsLoading}
              className="text-purple-400 hover:text-purple-300 p-2 rounded-lg hover:bg-gray-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] min-w-[44px] flex items-center justify-center"
              title={`Send SMS Reminder to ${name}`}
            >
              <span className="text-lg">{smsLoading ? "⏳" : "📱"}</span>
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

export default StudentTableRow;