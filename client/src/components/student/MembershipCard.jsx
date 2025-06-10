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
        return status && typeof status === "string"
          ? status.charAt(0).toUpperCase() + status.slice(1)
          : "Unknown";
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
              className="h-16 w-16 mx-auto"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Active Membership
          </h3>
          <p className="text-gray-600 mb-4">
            You don't have an active membership yet.
          </p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Contact Admin for Membership
          </button>
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

    if (startDate > now) return "pending";
    if (endDate < now) return "expired";

    //Check if expiring within 7 days
    const daysUntilExpiry = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry <= 7) return "expiring-soon";

    return "active";
  };

  const calculateDaysRemaining = (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  };

  const status = calculateStatus(membership);
  const isExpired = status === "expired";
  const daysRemaining = calculateDaysRemaining(membership.endDate);

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <svg
            className="h-5 w-5 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
            />
          </svg>
          Current Membership
        </h2>
        <StatusBadge status={status} />
      </div>

      <div className="grid">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">Plan Type</p>
          <p className="text-lg font-semibold text-gray-900">
            {membership.type || "Standard"}
          </p>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">Valid Until</p>
          <p className="text-lg font-semibold text-gray-900">
            {formatDate(membership.endDate)}
          </p>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">
            {isExpired ? "Status" : "Days Remaining"}
          </p>
          <p
            className={`text-lg font-semibold ${
              isExpired
                ? "text-red-600"
                : daysRemaining <= 7
                ? "text-yellow-600"
                : "text-green-600"
            }`}
          >
            {isExpired ? "Expired" : `${daysRemaining} days`}
          </p>
        </div>
      </div>

      {/* Progress bar for active memberships */}
      {status === "active" && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-500 mb-1">
            <span>Membership Progress</span>
            <span>
              {Math.max(0, Math.round((1 - daysRemaining / 30) * 100))}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                daysRemaining <= 7 ? "bg-yellow-500" : "bg-green-500"
              }`}
              style={{
                width: `${Math.max(
                  5,
                  Math.min(100, (1 - daysRemaining / 30) * 100)
                )}%`,
              }}
            ></div>
          </div>
        </div>
      )}
      {/* Warning for expiring memberships */}
      {status === "expiring-soon" && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-center">
            <svg
              className="h-5 w-5 text-yellow-400 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <p className="text-sm text-yellow-800">
              Your membership is expiring soon. Contact support to renew.
            </p>
          </div>
        </div>
      )}
      {/* Error state for expired memberships */}
      {status === "expired" && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex item-center">
            <svg
              className="h-5 w-5 text-red-400 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm text-red-800">
              Your membership has expired. Please renew to continue accessing
              services.
            </p>
          </div>
        </div>
      )}

      <div className="border-t pt-4 flex justify-between items-center text-sm text-gray-500">
        <span>Started: {formatDate(membership.startDate)}</span>
        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
          ID: {membership.id}
        </span>
      </div>
    </div>
  );
};

export default MembershipCard;
