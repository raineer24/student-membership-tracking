const StatusBadge = (status) => {
  const getStatusClass = () => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  const getStatusText = () => {
    switch (status) {
      case "expiring-soon":
        return "Expiring soon";
      default:
        return status?.charAt(0).toUpperCase() + status?.slice(1) || "Unknown";
    }
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-sx font-medium${getStatusClass()}`}
    >
      {getStatusText()}
    </span>
  );
};

const MembershipCard = ({ membership }) => {
  if (!membership) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Membership Status</h2>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <svg
              className="h-12 w-12 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p className="text-gray-500 text-lg">No active membership found</p>
              <p className="text-gray-400 text-sm mt-2">Contact support to activate your membership</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const calculateStatus = () => {
    const now = new Date();
    const startDate = new Date(membership.startDate);
    const endDate = new Date(membership.endDate);

    if (startDate > now) return 'pending';
    if (endDate < now) return 'expired';

    //Check if expiring within 7 days
    const daysUntilExpiry = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry <= 7) return 'expiring-soon';

    return 'active';
  }

  const calculateDaysRemaining = (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  };

  const status = calculateStatus(membership);
  const isExpired = status === 'expired';
  const daysRemaining = calculateDaysRemaining(membership.endDate);

  return ()
};

export default MembershipCard;
