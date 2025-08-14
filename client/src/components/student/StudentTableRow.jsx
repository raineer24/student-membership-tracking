// File: client/src/components/student/StudentTableRow.jsx
// Lines 1-110: Complete table row component with enhanced functionality
import React from 'react';
import StudentStatusBadge from './StudentStatusBadge';
import { formatDueDate } from '../../utils/dateUtils';
import { getStudentPricingDisplay } from '../../utils/studentPricingUtils';

/**
 * StudentTableRow Component
 * Renders individual student table row with all actions and information
 * @param {Object} student - Student object
 * @param {Function} onProcessPayment - Payment processing handler
 * @param {Function} onViewStudent - View student handler
 * @param {Function} onEditStudent - Edit student handler
 * @param {Function} onSendReminder - SMS reminder handler
 * @param {Function} canSendReminder - Function to check if reminder can be sent
 * @param {boolean} smsLoading - SMS loading state
 * @param {Function} getStudentStatus - Function to get student status
 */
const StudentTableRow = ({ 
  student, 
  onProcessPayment, 
  onViewStudent, 
  onEditStudent, 
  onSendReminder, 
  canSendReminder, 
  smsLoading, 
  getStudentStatus 
}) => {
  // Lines 25-35: Helper function to get latest membership
  const getLatestMembership = (student) => {
    if (!student?.memberships || student.memberships.length === 0) return null;
    
    return student.memberships.reduce((latest, current) => {
      if (!current?.endDate) return latest;
      const currentEndDate = new Date(current.endDate);
      const latestEndDate = new Date(latest?.endDate || 0);
      return currentEndDate > latestEndDate ? current : latest;
    }, null);
  };

  // Lines 37-42: Data preparation with enhanced validation
  const status = getStudentStatus(student);
  const latestMembership = getLatestMembership(student);
  const dueDateInfo = formatDueDate(latestMembership?.endDate);
  const pricingInfo = getStudentPricingDisplay(student);
  const canSendSMS = canSendReminder(student);

  // Lines 44-110: JSX return with complete table row structure
  return (
    <tr className="hover:bg-gray-700 hover:bg-opacity-50 transition-colors">
      {/* Student Information Cell */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div>
            {/* Student Name */}
            <div className="text-sm font-medium text-white">
              {student.name || "Unknown"}
            </div>
            
            {/* Student Email */}
            <div className="text-sm text-gray-400">
              {student.email || "No email"}
            </div>
            
            {/* Student Phone (if available) */}
            {student.phone && (
              <div className="text-xs text-gray-500">
                {student.phone}
              </div>
            )}
            
            {/* Pricing Information */}
            <div className="text-xs text-gray-500 mt-1 flex items-center space-x-1">
              {pricingInfo.isLegacy && (
                <span className="text-purple-400">🌟</span>
              )}
              <span>{pricingInfo.monthlyFormatted}/mo</span>
              {pricingInfo.isLegacy && (
                <span className="text-purple-400">({pricingInfo.tierLabel})</span>
              )}
            </div>
          </div>
        </div>
      </td>
      
      {/* Status Cell - Uses StudentStatusBadge component */}
      <td className="px-6 py-4 whitespace-nowrap">
        <StudentStatusBadge status={status} student={student} />
      </td>
      
      {/* Membership Information Cell */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-white">
          {latestMembership?.type || latestMembership?.membershipType || "No Membership"}
        </div>
        {latestMembership?.startDate && (
          <div className="text-xs text-gray-400">
            Started: {new Date(latestMembership.startDate).toLocaleDateString()}
          </div>
        )}
      </td>
      
      {/* Due Date Cell */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`text-sm ${dueDateInfo.color}`}>
          {dueDateInfo.text}
        </span>
      </td>
      
      {/* Actions Cell */}
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center justify-end space-x-2">
          {/* View Button */}
          <button
            onClick={() => onViewStudent(student.id)}
            className="text-blue-400 hover:text-blue-300 p-1 rounded transition-colors"
            title="View Student Details"
          >
            👁️
          </button>
          
          {/* Edit Button */}
          <button
            onClick={() => onEditStudent(student)}
            className="text-green-400 hover:text-green-300 p-1 rounded transition-colors"
            title="Edit Student Information"
          >
            ✏️
          </button>
          
          {/* Payment Button */}
          <button
            onClick={() => onProcessPayment(student)}
            className="text-yellow-400 hover:text-yellow-300 p-1 rounded transition-colors"
            title="Process Payment"
          >
            💳
          </button>
          
          {/* SMS Reminder Button (conditional) */}
          {canSendSMS && (
            <button
              onClick={() => onSendReminder(student)}
              disabled={smsLoading}
              className="text-purple-400 hover:text-purple-300 p-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Send SMS Reminder"
            >
              {smsLoading ? "⏳" : "📱"}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

export default StudentTableRow;