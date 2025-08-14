// client/src/components/student/StudentTableRow.jsx
// Lines 1-8: Imports and dependencies
import React from 'react';
import StudentStatusBadge from './StudentStatusBadge';
import { formatDueDate } from '../../utils/dateUtils';

// Lines 9-95: Main StudentTableRow component
// Purpose: Individual student table row with actions and status display
// Used in: StudentsTable component for rendering each student row
const StudentTableRow = ({ 
  student, 
  onProcessPayment, 
  onViewStudent, 
  onEditStudent, 
  onSendReminder 
}) => {
  // Lines 9-17: Get latest membership and format due date
  const getLatestMembership = (student) => {
    if (!student.memberships || student.memberships.length === 0) return null;
    return student.memberships.reduce((latest, current) => {
      return new Date(current.startDate) > new Date(latest.startDate) ? current : latest;
    });
  };

  const latestMembership = getLatestMembership(student);
  const dueDateInfo = formatDueDate(latestMembership?.endDate);

  // Lines 18-95: Main component render
  return (
    <tr className="hover:bg-gray-700 hover:bg-opacity-50 transition-colors">
      {/* Student ID */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
        {student.id}
      </td>
      
      {/* Student Name */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div>
            <div className="text-sm font-medium text-white">{student.name}</div>
            <div className="text-sm text-gray-400">{student.email}</div>
          </div>
        </div>
      </td>

      {/* Phone Number */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
        {student.phone || 'N/A'}
      </td>

      {/* Status with Pricing */}
      <td className="px-6 py-4 whitespace-nowrap">
        <StudentStatusBadge student={student} />
      </td>

      {/* Due Date */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className={`text-sm font-medium ${dueDateInfo.color}`}>
          {dueDateInfo.text}
        </div>
      </td>

      {/* Start Date */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
        {latestMembership?.startDate 
          ? new Date(latestMembership.startDate).toLocaleDateString()
          : 'N/A'
        }
      </td>

      {/* Actions */}
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex space-x-2">
          <button
            onClick={() => onSendReminder(student)}
            className="bg-yellow-600 text-white px-3 py-1 rounded text-xs hover:bg-yellow-700 transition-colors flex items-center space-x-1"
            title="Send SMS reminder"
          >
            <span>📱</span>
            <span>SMS</span>
          </button>
          
          <button
            onClick={() => onProcessPayment(student)}
            className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors flex items-center space-x-1"
            title="Process payment"
          >
            <span>💳</span>
            <span>Pay</span>
          </button>
          
          <button
            onClick={() => onViewStudent(student.id)}
            className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors flex items-center space-x-1"
            title="View student details"
          >
            <span>👁️</span>
            <span>View</span>
          </button>
          
          <button
            onClick={() => onEditStudent(student)}
            className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 transition-colors flex items-center space-x-1"
            title="Edit student information"
          >
            <span>✏️</span>
            <span>Edit</span>
          </button>
        </div>
      </td>
    </tr>
  );
};

export default StudentTableRow;