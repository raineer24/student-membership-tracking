const StatusBadge = ({ status }) => {
  const getStatusClass = () => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "expired":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass()}`}
    >
      {status?.charAt(0).toUpperCase() + status?.slice(1) || "Unknown"}
    </span>
  );
};

const MembershipCard = ({ membership }) => {
  if (!membership) {
    return (
      <div className="bg-white">
        <h2 className="text-xl">Membership Status</h2>
        <p className="text-gray-500">No active membership found</p>
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

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };
};

const isExpired = new Date(membership.endDate) < new Date();
const daysRemaining = Math.ceil(
  (new Date(membership.endDate) - new Date()) / (1000 * 60 * 60 * 24)
);

return (
  <div className="bg-white">
    <div className="flex justify-between items-start mb-4">
      <h2 className="text-xl font-semibold">Current Membership</h2>
      <StatusBadge status={membership.status} />
    </div>

    <div className="grid grid-cols-1">
      <div>
        <p className="text-sm text-gray-500 mb-1">Plan Type</p>
        <p className="font-medium">{membership.type}</p>
      </div>

      <div>
        <p className="text-sm text-gray-500 mb-1">Valid Until</p>
        <p className="font-medium">{formatDate(membership.endDate)}</p>
      </div>

      <div>
        <p className="text-sm text-gray-500 mb-1">
          {isExpired ? "Status" : "Days Remaining "}
        </p>
        <p
          className={`font-medium ${
            isExpired
              ? "text-red-600"
              : daysRemaining <= 30
              ? "text-yellow-600"
              : "text-green-600"
          }`}
        >
          {isExpired ? "Status" : "Days Remaining "}
        </p>
      </div>
    </div>

    <div className="border-t pt-4 flex justify-between text-sm text-gray-500">
      <span>Started: {formatDate(membership.startDate)}</span>
      <span>Price: {formatDate(membership.price)}</span>
    </div>
  </div>
);

export default MembershipCard;
