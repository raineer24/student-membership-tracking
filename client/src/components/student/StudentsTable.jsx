// client/src/components/student/StudentsTable.jsx
// Lines 1-7: Imports and dependencies
import React from 'react';
import StudentTableRow from './StudentTableRow';

// Lines 8-87: Main StudentsTable component
// Purpose: Container for student table with headers and rows
// Used in: DashboardPage for displaying filtered students
const StudentsTable = ({ 
  students, 
  loading, 
  onProcessPayment, 
  onViewStudent, 
  onEditStudent, 
  onSendReminder,
  getStudentStatus
}) => {
  // Lines 8-20: Loading state render
  if (loading) {
    return (
      <div className="px-6 py-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-400">Loading students...</p>
      </div>
    );
  }

  // Lines 21-30: Empty state render
  if (!students || students.length === 0) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-gray-400">No students found matching your criteria.</p>
      </div>
    );
  }

  // Lines 31-87: Main table render
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-600">
        {/* Table Header */}
        <thead className="bg-gray-700 bg-opacity-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Student
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Phone
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Status & Pricing
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Due Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Start Date
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody className="bg-gray-800 bg-opacity-30 divide-y divide-gray-600">
          {students.map((student) => (
            <StudentTableRow
              key={student.id}
              student={student}
              onProcessPayment={onProcessPayment}
              onViewStudent={onViewStudent}
              onEditStudent={onEditStudent}
              onSendReminder={onSendReminder}
              getStudentStatus={getStudentStatus}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StudentsTable;