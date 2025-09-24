// File: client/src/utils/profileHelpers.js
// Lines 1-35: Badge generation functions extracted from StudentProfileView

export const getPaymentStatusBadge = (status) => {
  const statusStyles = {
    completed: "bg-green-500 bg-opacity-20 text-green-400 border-green-500",
    pending: "bg-yellow-500 bg-opacity-20 text-yellow-400 border-yellow-500",
    failed: "bg-red-500 bg-opacity-20 text-red-400 border-red-500",
    cancelled: "bg-gray-500 bg-opacity-20 text-gray-400 border-gray-500"
  };
  
  const style = statusStyles[status?.toLowerCase()] || statusStyles.pending;
  const displayStatus = status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown";
  
  return `inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full border ${style}`;
};

export const getTrainingStatusBadge = (status) => {
  const statusStyles = {
    PRESENT: "bg-green-500 bg-opacity-20 text-green-400 border-green-500",
    LATE: "bg-yellow-500 bg-opacity-20 text-yellow-400 border-yellow-500", 
    LEFT_EARLY: "bg-orange-500 bg-opacity-20 text-orange-400 border-orange-500",
    ABSENT: "bg-red-500 bg-opacity-20 text-red-400 border-red-500"
  };
  
  const style = statusStyles[status] || statusStyles.PRESENT;
  const displayStatus = {
    PRESENT: "Present",
    LATE: "Late", 
    LEFT_EARLY: "Left Early",
    ABSENT: "Absent"
  }[status] || status;
  
  return `inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full border ${style}`;
};