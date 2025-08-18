// File: client/src/components/student/StudentTableRow.jsx
// Simplified version without complex utility imports to fix build
import React from 'react';

/**
 * StudentTableRow Component - Simplified Version
 * Renders individual student table row with minimal dependencies
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
  // Simplified helpers without external imports
  const getLatestMembership = (student) => {
    if (!student?.memberships || student.memberships.length === 0) return null;
    
    return student.memberships.reduce((latest, current) => {
      if (!current?.endDate) return latest;
      const currentEndDate = new Date(current.endDate);
      const latestEndDate = new Date(latest?.endDate || 0);
      return currentEndDate > latestEndDate ? current : latest;
    }, null);
  };

  const formatSimpleDueDate = (dateString) => {
    if (!dateString) return { text: "N/A", color: "text-gray-400" };
    
    try {
      const endDate = new Date(dateString);
      const today = new Date();
      
      today.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      
      const timeDiff = endDate.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      
      if (daysDiff > 7) {
        return { text: `${daysDiff} days remaining`, color: "text-green-400" };
      } else if (daysDiff > 0) {
        return { text: `${daysDiff} day${daysDiff === 1 ? '' : 's'} remaining`, color: "text-yellow-400" };
      } else if (daysDiff === 0) {
        return { text: "Due today", color: "text-orange-400 font-medium" };
      } else {
        const overdueDays = Math.abs(daysDiff);
        return { text: `${overdueDays} day${overdueDays === 1 ? '' : 's'} overdue`, color: "text-red-400 font-medium" };
      }
    } catch (error) {
      return { text: "Invalid Date", color: "text-red-400" };
    }
  };

  const getSimplePricing = (student) => {
    const monthlyRate = student?.monthlyRate || 1400;
    const isLegacy = student?.isLegacyStudent || false;
    
    let tierLabel = "Standard";
    if (isLegacy) {
      if (monthlyRate === 1000) tierLabel = "Founding";
      else if (monthlyRate === 1200) tierLabel = "Early";
      else tierLabel = "Legacy";
    }
    
    return {
      monthlyFormatted: `₱${monthlyRate.toLocaleString()}`,
      isLegacy,
      tierLabel
    };
  };

  const getStatusBadge = (status) => {
    const configs = {
      active: { color: "bg-green-100 text-green-800", icon: "✅", label: "Active" },
      expiring: { color: "bg-yellow-100 text-yellow-800", icon: "⚠️", label: "Expiring" },
      overdue: { color: "bg-red-100 text-red-800", icon: "🚨", label: "Overdue" },
      inactive: { color: "bg-gray-100 text-gray-800", icon: "⭕", label: "Inactive" }
    };
    
    const config = configs[status] || configs.inactive;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </span>
    );
  };

  // Data preparation
  const status = getStudentStatus(student);
  const latestMembership = getLatestMembership(student);
  const dueDateInfo = formatSimpleDueDate(latestMembership?.endDate);
  const pricingInfo = getSimplePricing(student);
  const canSendSMS = canSendReminder(student);

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
            {(student.phoneNumber || student.phone) && (
              <div className="text-xs text-gray-500">
                {student.phoneNumber || student.phone}
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
      
      {/* Status Cell */}
      <td className="px-6 py-4 whitespace-nowrap">
        {getStatusBadge(status)}
        {pricingInfo.isLegacy && (
          <div className="mt-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              <span className="mr-1">🌟</span>
              {pricingInfo.tierLabel}
            </span>
          </div>
        )}
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