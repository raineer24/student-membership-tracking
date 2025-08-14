// File: client/src/components/student/StudentStatusBadge.jsx
// Lines 1-45: Enhanced status badge component with pricing tier display
import React from 'react';
import { getPricingTier } from '../../utils/studentPricingUtils';

/**
 * StudentStatusBadge Component
 * Displays student status (active, expiring, overdue, inactive) and pricing tier
 * @param {string} status - Student status (active, expiring, overdue, inactive)
 * @param {Object} student - Student object with pricing information
 */
const StudentStatusBadge = ({ status, student }) => {
  // Lines 12-30: Status configuration with enhanced styling
  const statusConfig = {
    active: { 
      bg: "bg-green-500 bg-opacity-20", 
      text: "text-green-400", 
      border: "border-green-500",
      label: "Active" 
    },
    expiring: { 
      bg: "bg-yellow-500 bg-opacity-20", 
      text: "text-yellow-400", 
      border: "border-yellow-500",
      label: "Expiring Soon" 
    },
    inactive: { 
      bg: "bg-gray-500 bg-opacity-20", 
      text: "text-gray-400", 
      border: "border-gray-500",
      label: "Inactive" 
    },
    overdue: { 
      bg: "bg-red-500 bg-opacity-20", 
      text: "text-red-400", 
      border: "border-red-500",
      label: "Overdue" 
    }
  };
  
  // Lines 35-37: Configuration selection and pricing tier calculation
  const config = statusConfig[status] || statusConfig.inactive;
  const pricingTier = getPricingTier(student);
  
  // Lines 39-55: JSX return with status and pricing tier display
  return (
    <div className="flex flex-col space-y-1">
      {/* Status Badge */}
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${config.bg} ${config.text} ${config.border}`}>
        {config.label}
      </span>
      
      {/* Pricing Tier Badge (only for legacy students) */}
      {pricingTier && (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${pricingTier.bg} ${pricingTier.color} ${pricingTier.border}`}>
          {pricingTier.emoji} {pricingTier.label}
        </span>
      )}
    </div>
  );
};

export default StudentStatusBadge;