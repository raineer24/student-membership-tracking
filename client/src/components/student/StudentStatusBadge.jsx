// File: client/src/components/student/StudentStatusBadge.jsx
// Lines 120-180: Status badge component with pricing tier display
import React from 'react';
import { getPricingTier } from '../../utils/studentPricingUtils';

/**
 * StudentStatusBadge Component
 * Displays student status with appropriate styling and pricing tier information
 * @param {string} status - Student status (active, expiring, overdue, inactive)
 * @param {Object} student - Student object for pricing tier calculation
 */
const StudentStatusBadge = ({ status, student }) => {
  // Lines 130-135: Status configuration with colors and icons
  const statusConfig = {
    active: {
      color: "bg-green-100 text-green-800",
      icon: "✅",
      label: "Active"
    },
    expiring: {
      color: "bg-yellow-100 text-yellow-800",
      icon: "⚠️",
      label: "Expiring"
    },
    overdue: {
      color: "bg-red-100 text-red-800",
      icon: "🚨",
      label: "Overdue"
    },
    inactive: {
      color: "bg-gray-100 text-gray-800",
      icon: "⭕",
      label: "Inactive"
    }
  };

  // Lines 140-145: Get configuration for current status
  const config = statusConfig[status] || statusConfig.inactive;
  const pricingTier = getPricingTier(student);

  return (
    <div className="flex flex-col space-y-1">
      {/* Main Status Badge */}
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </span>
      
      {/* Pricing Tier Badge (if legacy student) */}
      {pricingTier.isLegacy && (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${pricingTier.badgeColor}`}>
          <span className="mr-1">🌟</span>
          {pricingTier.tierLabel}
        </span>
      )}
    </div>
  );
};

export default StudentStatusBadge;