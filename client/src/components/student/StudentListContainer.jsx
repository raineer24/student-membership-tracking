// File: client/src/components/student/StudentListContainer.jsx
// Lines 1-120: Container for student list rendering (mobile + desktop)
import React from 'react';
import StudentCard from './StudentCard';
import StudentTableRow from './StudentTableRow';

/**
 * StudentListContainer Component
 * Handles student list rendering for both mobile and desktop layouts
 * Lines 10-15: Container pattern - separates rendering logic from coordination
 */
const StudentListContainer = ({
  students,
  onProcessPayment,
  onViewStudent,
  onEditStudent,
  onSendReminder,
  onLogTraining,
  canSendReminder,
  getStudentStatus,
  getDaysRemaining,
  smsLoading,
  isSearchActive,
  currentTab
}) => {
  // Lines 25-35: Early return for empty state
  if (!students || students.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-lg font-semibold text-white mb-2">
          {isSearchActive || currentTab !== "all" ? 'No students found' : 'No students yet'}
        </h3>
        <p className="text-gray-400 mb-6 max-w-md mx-auto">
          {isSearchActive || currentTab !== "all" 
            ? "Try adjusting your search terms or filter criteria to find what you're looking for."
            : "Get started by adding your first student to begin managing memberships and payments."
          }
        </p>
      </div>
    );
  }

  // Lines 40-50: Common props object - reduces prop drilling
  const studentProps = {
    onProcessPayment,
    onViewStudent,
    onEditStudent,
    onSendReminder,
    onLogTraining,
    canSendReminder,
    getStudentStatus,
    getDaysRemaining,
    smsLoading
  };

  return (
    <>
      {/* Mobile Cards Layout */}
      <div className="block lg:hidden">
        <div className="p-4 space-y-4">
          {students.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              {...studentProps}
            />
          ))}
        </div>
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Student Information
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Membership
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibel text-gray-300 uppercase tracking-wider">
                Due Date
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {students.map((student) => (
              <StudentTableRow
                key={student.id}
                student={student}
                {...studentProps}
              />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default StudentListContainer;