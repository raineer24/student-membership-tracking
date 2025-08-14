// client/src/components/student/StudentStatusBadge.jsx
// Lines 1-8: Imports and dependencies
import React from 'react';
import { getStudentPricingDisplay } from '../../utils/studentPricingUtils';

// Lines 9-54: Main StudentStatusBadge component
// Purpose: Display student status badge with pricing tier and status indicator
// Used in: StudentTableRow component for consistent status display
const StudentStatusBadge = ({ student, studentStatus }) => {
  const pricingInfo = getStudentPricingDisplay(student);

  // Lines 15-20: Determine badge color based on student status
  const getBadgeColor = () => {
    if (studentStatus === 'active') return "bg-green-500";
    if (studentStatus === 'overdue') return "bg-red-500";
    if (studentStatus === 'inactive') return "bg-gray-500";
    return "bg-gray-500";
  };

  // Lines 21-26: Determine status text
  const getStatusText = () => {
    if (studentStatus === 'active') return "Active";
    if (studentStatus === 'overdue') return "Overdue";
    if (studentStatus === 'inactive') return "Inactive";
    return "Unknown";
  };

  // Lines 27-54: Main component render
  return (
    <div className="flex flex-col space-y-1">
      {/* Status badge */}
      <div className="flex items-center space-x-2">
        <span className={`
          inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white
          ${getBadgeColor()}
        `}>
          {getStatusText()}
        </span>
      </div>
      
      {/* Pricing tier display */}
      <div className="text-xs">
        <div className={`font-medium ${pricingInfo.color}`}>
          {pricingInfo.text}
        </div>
        {pricingInfo.rate && (
          <div className="text-gray-400">
            {pricingInfo.rate}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentStatusBadge;