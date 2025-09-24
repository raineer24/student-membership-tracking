// File: client/src/utils/profileStats.js
// Lines 1-32: Statistical calculation functions extracted from StudentProfileView

export const calculateMembershipStatus = (memberships) => {
  if (!memberships || !Array.isArray(memberships) || memberships.length === 0) {
    return {
      status: "inactive",
      message: "No active membership",
      color: "text-gray-400",
      bgColor: "bg-gray-500",
      icon: "⚫"
    };
  }

  try {
    const latestMembership = memberships.reduce((latest, current) => {
      if (!current) return latest;
      const currentEndDate = new Date(current.endDate || 0);
      const latestEndDate = new Date(latest.endDate || 0);
      return currentEndDate > latestEndDate ? current : latest;
    });

    if (!latestMembership?.endDate) {
      return { status: "inactive", message: "No end date", color: "text-gray-400", bgColor: "bg-gray-500", icon: "⚫" };
    }

    const today = new Date();
    const endDate = new Date(latestMembership.endDate);
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 7) return { status: "active", message: `${diffDays} days remaining`, color: "text-green-400", bgColor: "bg-green-500", icon: "✅" };
    if (diffDays > 0) return { status: "expiring", message: `${diffDays} day${diffDays === 1 ? '' : 's'} remaining`, color: "text-yellow-400", bgColor: "bg-yellow-500", icon: "⚠️" };
    if (diffDays === 0) return { status: "expiring", message: "Expires today", color: "text-orange-400", bgColor: "bg-orange-500", icon: "🔔" };
    return { status: "overdue", message: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'}`, color: "text-red-400", bgColor: "bg-red-500", icon: "🚨" };
  } catch (error) {
    console.error('Membership status calculation error:', error);
    return { status: "inactive", message: "Error calculating status", color: "text-red-400", bgColor: "bg-red-500", icon: "❌" };
  }
};