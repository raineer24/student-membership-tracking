// File: client/src/components/dashboard/AnnouncementBanner.jsx
// Lines 1-10: FIXED AnnouncementBanner - Eliminates replace() undefined errors
import React, { useState, useCallback } from "react";

/**
 * AnnouncementBanner Component - PRODUCTION READY
 * Displays announcement banners with safe string operations
 * 
 * CRITICAL FIXES APPLIED:
 * - Eliminated all .replace() calls on potentially undefined values
 * - Safe string handling for all announcement properties
 * - Enhanced error prevention for malformed announcement data
 * - Comprehensive null/undefined checks throughout
 */

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

  // FIXED: Safe string processing for event types
  const formatEventType = (eventType) => {
    if (!eventType || typeof eventType !== 'string') {
      return 'GENERAL';
    }
    // CRITICAL FIX: Safe replace operation
    return eventType.toUpperCase().replace(/_/g, ' ').trim();
  };

  // Get banner styling based on event type
  const getBannerStyle = (eventType) => {
    // FIXED: Safe eventType handling with fallback
    const safeEventType = eventType || 'GENERAL';
    
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

    return styles[safeEventType] || styles["GENERAL"];
  };

  // FIXED: Safe date range formatting
  const formatDateRange = (startDate, endDate) => {
    if (!startDate) return "No date specified";

    try {
      const start = new Date(startDate);
      // Validate date
      if (isNaN(start.getTime())) return "Invalid date";
      
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
      if (isNaN(end.getTime())) {
        return start.toLocaleDateString("en-US", formatOptions);
      }
      
      return `${start.toLocaleDateString(
        "en-US",
        formatOptions
      )} - ${end.toLocaleDateString("en-US", formatOptions)}`;
    } catch (error) {
      return "Date formatting error";
    }
  };

  // FIXED: Safe time ago formatting
  const formatTimeAgo = (dateString) => {
    if (!dateString) return "Unknown time";
    
    try {
      const now = new Date();
      const date = new Date(dateString);
      
      // Validate dates
      if (isNaN(now.getTime()) || isNaN(date.getTime())) {
        return "Invalid time";
      }
      
      const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

      if (diffInHours < 1) return "Just now";
      if (diffInHours < 24)
        return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;

      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays === 1) return "Yesterday";
      return `${diffInDays} days ago`;
    } catch (error) {
      return "Time calculation error";
    }
  };

  // FIXED: Safe priority formatting
  const formatPriority = (priority) => {
    if (!priority || typeof priority !== 'string') {
      return '';
    }
    return priority.toUpperCase();
  };

  // FIXED: Safe string extraction with fallbacks
  const getSafeAnnouncementData = (announcement) => {
    if (!announcement || typeof announcement !== 'object') {
      return {
        id: Date.now(),
        title: 'Unknown Announcement',
        message: 'No message available',
        eventType: 'GENERAL',
        priority: 'normal',
        createdBy: 'admin',
        createdAt: new Date().toISOString(),
        startDate: null,
        endDate: null
      };
    }

    return {
      id: announcement.id || Date.now(),
      title: String(announcement.title || 'Announcement'),
      message: String(announcement.message || 'No message available'),
      eventType: String(announcement.eventType || 'GENERAL'),
      priority: String(announcement.priority || 'normal'),
      createdBy: String(announcement.createdBy || 'admin'),
      createdAt: announcement.createdAt || new Date().toISOString(),
      startDate: announcement.startDate || null,
      endDate: announcement.endDate || null,
      smsRecipients: announcement.smsRecipients || 0,
      smsCost: announcement.smsCost || 0
    };
  };

  // Input validation
  if (!announcements || !Array.isArray(announcements) || announcements.length === 0) {
    return null;
  }

  return (
    <div className="mb-8 space-y-4">
      {announcements.map((announcementRaw, index) => {
        // FIXED: Safe data extraction
        const announcement = getSafeAnnouncementData(announcementRaw);
        const style = getBannerStyle(announcement.eventType);
        const isDismissing = dismissingIds.has(announcement.id);

        return (
          <div
            key={announcement.id}
            className={`${style.bgColor} ${
              style.borderColor
            } border-l-4 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl ${
              isDismissing
                ? "opacity-0 transform translate-x-full"
                : "opacity-100 transform translate-x-0"
            }`}
            style={{
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
                        {/* CRITICAL FIX: Safe event type formatting */}
                        {formatEventType(announcement.eventType)}
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
                            {/* FIXED: Safe priority formatting */}
                            {formatPriority(announcement.priority)}
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
                      <span>Posted by {announcement.createdBy}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-purple-500">🕒</span>
                      <span>{formatTimeAgo(announcement.createdAt)}</span>
                    </div>
                  </div>

                  {/* FIXED: Safe SMS Status display */}
                  {announcement.smsRecipients > 0 && (
                    <div className="mt-4 flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1 bg-green-100 text-green-800 px-3 py-1 rounded-full">
                        <span>📱</span>
                        <span>SMS sent to {announcement.smsRecipients} students</span>
                      </div>
                      {announcement.smsCost > 0 && (
                        <div className="flex items-center space-x-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                          <span>💰</span>
                          <span>Cost: ₱{announcement.smsCost.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2">
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
                    onClick={() => handleDismiss(announcement.id)}
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

      {/* Keyframe animation */}
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