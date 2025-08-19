// File: client/src/components/dashboard/AnnouncementBanner.jsx
// FIXED: Removed styled-jsx to prevent styling conflicts
import React, { useState, useCallback } from "react";

const AnnouncementBanner = ({ announcements, onDismiss, onEdit }) => {
  const [dismissingIds, setDismissingIds] = useState(new Set());

  const handleDismiss = useCallback(
    (id) => {
      setDismissingIds((prev) => new Set([...prev, id]));

      setTimeout(() => {
        onDismiss(id);
        setDismissingIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      }, 300);
    },
    [onDismiss]
  );

  // Get banner styling based on event type
  const getBannerStyle = (eventType) => {
    const styles = {
      NO_CLASSES: {
        borderColor: "border-l-red-500",
        bgColor: "bg-gradient-to-r from-red-50 to-pink-50",
        icon: "🚫",
        badgeBg: "bg-red-100",
        badgeText: "text-red-800",
      },
      GENERAL: {
        borderColor: "border-l-blue-500",
        bgColor: "bg-gradient-to-r from-blue-50 to-cyan-50",
        icon: "📢",
        badgeBg: "bg-blue-100",
        badgeText: "text-blue-800",
      },
      BANNER: {
        borderColor: "border-l-purple-500",
        bgColor: "bg-gradient-to-r from-purple-50 to-indigo-50",
        icon: "🎯",
        badgeBg: "bg-purple-100",
        badgeText: "text-purple-800",
      },
      SMS: {
        borderColor: "border-l-green-500",
        bgColor: "bg-gradient-to-r from-green-50 to-emerald-50",
        icon: "📱",
        badgeBg: "bg-green-100",
        badgeText: "text-green-800",
      },
    };

    return styles[eventType] || styles["GENERAL"];
  };

  // Format date range for display
  const formatDateRange = (startDate, endDate) => {
    if (!startDate) return "No date specified";

    const start = new Date(startDate);
    const formatOptions = {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    };

    if (!endDate) {
      return start.toLocaleDateString("en-US", formatOptions);
    }

    const end = new Date(endDate);
    return `${start.toLocaleDateString(
      "en-US",
      formatOptions
    )} - ${end.toLocaleDateString("en-US", formatOptions)}`;
  };

  // Format time ago
  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24)
      return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "Yesterday";
    return `${diffInDays} days ago`;
  };

  if (!announcements || announcements.length === 0) return null;

  return (
    <div className="mb-8 space-y-4">
      {announcements.map((announcement, index) => {
        const style = getBannerStyle(announcement.eventType);
        const isDismissing = dismissingIds.has(announcement.id);

        return (
          <div
            key={announcement.id || index}
            className={`${style.bgColor} ${
              style.borderColor
            } border-l-4 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl ${
              isDismissing
                ? "opacity-0 transform translate-x-full"
                : "opacity-100 transform translate-x-0"
            }`}
            style={{
              // Use inline animation to avoid styled-jsx conflicts
              animation: `slideInFromTop 0.4s ease-out ${index * 0.1}s both`,
            }}
          >
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 pr-4">
                  {/* Header */}
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="text-3xl">{style.icon}</span>
                    <h3 className="text-xl font-bold text-gray-900">
                      {announcement.title}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`${style.badgeBg} ${style.badgeText} px-3 py-1 rounded-full text-xs font-semibold`}
                      >
                        {announcement.eventType.replace("_", " ")}
                      </span>
                      {announcement.priority &&
                        announcement.priority !== "normal" && (
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              announcement.priority === "urgent"
                                ? "bg-red-100 text-red-800"
                                : announcement.priority === "high"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {announcement.priority.toUpperCase()}
                          </span>
                        )}
                    </div>
                  </div>

                  {/* Message */}
                  <p className="text-gray-800 mb-4 leading-relaxed text-lg">
                    {announcement.message}
                  </p>

                  {/* Metadata */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <span className="text-blue-500">📅</span>
                      <span>
                        {formatDateRange(
                          announcement.startDate,
                          announcement.endDate
                        )}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-green-500">👤</span>
                      <span>Posted by {announcement.createdBy || "admin"}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-purple-500">🕒</span>
                      <span>{formatTimeAgo(announcement.createdAt)}</span>
                    </div>
                  </div>

                  {/* SMS Status */}
                  {announcement.estimatedReach > 0 && (
                    <div className="mt-3 p-3 bg-white bg-opacity-50 rounded-lg border border-white border-opacity-30">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center space-x-2">
                          <span>📱</span>
                          <span>
                            SMS sent to {announcement.estimatedReach} students
                          </span>
                        </span>
                        <span className="font-medium text-green-700">
                          Cost: ₱{announcement.estimatedCost}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col space-y-2">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(announcement)}
                      className="text-gray-500 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-white hover:bg-opacity-50"
                      title="Edit announcement"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => handleDismiss(announcement.id || index)}
                    className="text-gray-500 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-white hover:bg-opacity-50"
                    title="Dismiss announcement"
                    disabled={isDismissing}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Add the keyframe animation to the document head */}
      <style>{`
        @keyframes slideInFromTop {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default AnnouncementBanner;