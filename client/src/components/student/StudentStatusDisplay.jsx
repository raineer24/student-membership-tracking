// File: client/src/components/student/StudentStatusDisplay.jsx
// Lines 1-60: Enhanced status display matching StudentManagementSection styling

import React from 'react';
import { getStatusConfig } from '../../utils/studentStatusConfig';

/**
 * StudentStatusDisplay Component
 * Displays student status with legacy badge using dark theme styling
 * Matches existing StudentManagementSection design patterns
 * @param {string} status - Student status (active, expiring, overdue, inactive)
 * @param {Object} student - Student object for legacy check
 * @param {boolean} showLegacy - Whether to show legacy badge (default: true)
 */
const StudentStatusDisplay = ({ status, student, showLegacy = true }) => {
  const config = getStatusConfig(status);
  const isLegacy = student?.isLegacyStudent || (student?.monthlyRate && student.monthlyRate < 1400);

  return (
    <div className="flex items-center space-x-2">
      {/* Main Status Badge - Dark Theme */}
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </span>
      
      {/* Legacy Badge - Consistent with existing styling */}
      {showLegacy && isLegacy && (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-600 text-white">
          ⭐ Legacy
        </span>
      )}
    </div>
  );
};

export default StudentStatusDisplay;