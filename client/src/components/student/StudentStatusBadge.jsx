// client/src/components/student/StudentStatusBadge.jsx
// Lines 1-8: Imports and dependencies
import React from 'react';
import { isOverdue } from '../../utils/dateUtils';
import { getStudentPricingDisplay } from '../../utils/studentPricingUtils';

// Lines 9-54: Main StudentStatusBadge component
// Purpose: Display student status badge with pricing tier and status indicator
// Used in: StudentTableRow component for consistent status display
const StudentStatusBadge = ({ student }) => {
  // Lines 9-14: Get latest membership and determine overdue status
  const latestMembership = student.memberships && student.memberships.length > 0 
    ? student.memberships.reduce((latest, current) => 
        new Date(current.startDate) > new Date(latest.startDate) ? current : latest
      ) 
    : null;
  
  const overdueStatus = isOverdue(latestMembership?.endDate);
  const pricingInfo = getStudentPricingDisplay(student);

  // Lines 15-20: Determine badge color based on student status
  const getBadgeColor = () => {
    if (!latestMembership) return "bg-gray-500";
    if (overdueStatus) return "bg-red-500";
    return "bg-green-500";
  };

  // Lines 21-26: Determine status text
  const getStatusText = () => {
    if (!latestMembership) return "No Membership";
    if (overdueStatus) return "Overdue";
    return "Active";
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