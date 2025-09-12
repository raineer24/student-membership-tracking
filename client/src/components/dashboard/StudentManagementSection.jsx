// File: client/src/components/dashboard/StudentManagementSection.jsx
// Lines 1-20: Enhanced Student Management with Mobile-First Design + Real Data Integration
import React from "react";

/**
 * StudentManagementSection Component - MOBILE-FIRST ENHANCED VERSION
 * Optimized for Realme C67 and all mobile devices while preserving existing functionality
 * 
 * ENHANCEMENTS APPLIED:
 * - Mobile-first responsive design (320px to desktop)
 * - Touch-friendly buttons (minimum 48px height)
 * - Horizontal scrollable tabs to prevent overflow
 * - Improved card layout with better spacing
 * - Enhanced search input with larger touch targets
 * - Real data integration preserved from existing hooks
 * - All business logic and API calls maintained
 * - Production-ready error handling
 * - Accessibility improvements (WCAG compliant)
 */

// Lines 25-100: Safe Date Utilities - Inline to prevent import issues
const safeDateParse = (dateInput) => {
  if (dateInput === null || dateInput === undefined) {
    return null;
  }
  
  try {
    if (dateInput instanceof Date) {
      return isNaN(dateInput.getTime()) ? null : dateInput;
    }
    
    const dateStr = String(dateInput).trim();
    if (!dateStr || dateStr === 'null' || dateStr === 'undefined') {
      return null;
    }
    
    const parsedDate = new Date(dateStr);
    return isNaN(parsedDate.getTime()) ? null : parsedDate;
  } catch (error) {
    return null;
  }
};

const calculateSafeDaysDifference = (endDateInput, startDateInput = null) => {
  try {
    const endDate = safeDateParse(endDateInput);
    if (!endDate) return null;
    
    const startDate = startDateInput ? safeDateParse(startDateInput) : new Date();
    if (!startDate) return null;
    
    const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    
    const timeDiff = endDateOnly.getTime() - startDateOnly.getTime();
    if (isNaN(timeDiff)) return null;
    
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    return isNaN(daysDiff) ? null : daysDiff;
  } catch (error) {
    return null;
  }
};

const formatSafeDueDate = (dateInput) => {
  if (!dateInput) {
    return { text: "N/A", color: "text-gray-400" };
  }
  
  try {
    const daysDiff = calculateSafeDaysDifference(dateInput);
    
    if (daysDiff === null || isNaN(daysDiff)) {
      return { text: "Invalid Date", color: "text-red-400" };
    }
    
    if (daysDiff > 7) {
      return { 
        text: `${daysDiff} days remaining`, 
        color: "text-green-400" 
      };
    } else if (daysDiff > 0) {
      return { 
        text: `${daysDiff} day${daysDiff === 1 ? '' : 's'} remaining`, 
        color: "text-yellow-400" 
      };
    } else if (daysDiff === 0) {
      return { 
        text: "Due today", 
        color: "text-orange-400 font-medium" 
      };
    } else {
      const overdueDays = Math.abs(daysDiff);
      return { 
        text: `${overdueDays} day${overdueDays === 1 ? '' : 's'} overdue`, 
        color: "text-red-400 font-medium" 
      };
    }
  } catch (error) {
    return { text: "Error", color: "text-red-400" };
  }
};

const getSafeLatestMembership = (student) => {
  if (!student || typeof student !== 'object') {
    return null;
  }

  if (!student.memberships || !Array.isArray(student.memberships) || student.memberships.length === 0) {
    return null;
  }

  try {
    const sortedMemberships = [...student.memberships].sort((a, b) => {
      const getDateValue = (membership) => {
        const dateStr = membership.createdAt || membership.endDate || membership.startDate;
        const date = safeDateParse(dateStr);
        return date ? date.getTime() : 0;
      };
      
      return getDateValue(b) - getDateValue(a); // DESC order - newest first
    });

    return sortedMemberships[0] || null;
  } catch (error) {
    return null;
  }
};

const getSafeStudentStatus = (student) => {
  try {
    if (!student || typeof student !== 'object') {
      return 'inactive';
    }

    const latestMembership = getSafeLatestMembership(student);
    if (!latestMembership || !latestMembership.endDate) {
      return 'inactive';
    }

    const daysDiff = calculateSafeDaysDifference(latestMembership.endDate);
    
    if (daysDiff === null || isNaN(daysDiff)) {
      return 'inactive';
    }

    if (daysDiff < 0) return 'overdue';
    if (daysDiff <= 7) return 'expiring';
    return 'active';
  } catch (error) {
    return 'inactive';
  }
};

const getSafeDaysRemaining = (student) => {
  try {
    if (!student || typeof student !== 'object') {
      return "No data";
    }

    const latestMembership = getSafeLatestMembership(student);
    if (!latestMembership || !latestMembership.endDate) {
      return "No membership";
    }

    const daysDiff = calculateSafeDaysDifference(latestMembership.endDate);
    
    if (daysDiff === null || isNaN(daysDiff)) {
      return "Invalid date";
    }

    if (daysDiff < 0) {
      const absDays = Math.abs(daysDiff);
      return `Expired ${absDays} day${absDays === 1 ? '' : 's'} ago`;
    }
    if (daysDiff === 0) {
      return "Expires today";
    }
    return `${daysDiff} day${daysDiff === 1 ? '' : 's'} remaining`;
    
  } catch (error) {
    return "Calculation error";
  }
};

// Lines 105-210: Enhanced Mobile-First Student Card Component
const StudentCard = ({ 
  student, 
  onProcessPayment, 
  onViewStudent, 
  onEditStudent, 
  onSendReminder, 
  canSendReminder, 
  smsLoading 
}) => {
  // Input validation
  if (!student || typeof student !== 'object') {
    return null;
  }

  // Safe data extraction
  const studentName = String(student.name || 'Unknown Student');
  const studentEmail = String(student.email || 'No email');
  const studentPhone = String(student.phone || student.phoneNumber || 'No phone');
  const monthlyRate = parseFloat(student.monthlyRate || student.rate || 1400);
  const isLegacy = student.isLegacyStudent || monthlyRate < 1400;

  // Use safe calculations
  const status = getSafeStudentStatus(student);
  const latestMembership = getSafeLatestMembership(student);
  const dueDateInfo = latestMembership?.endDate 
    ? formatSafeDueDate(latestMembership.endDate)
    : { text: "No membership", color: "text-gray-400" };

  // SMS eligibility check
  const canSendSMS = canSendReminder ? canSendReminder(student) : (
    (status === 'expiring' || status === 'overdue') && 
    Boolean(student.phone || student.phoneNumber)
  );

  // Status configuration
  const statusConfig = {
    active: { bg: "bg-green-600", text: "text-white", icon: "✅", label: "Active" },
    expiring: { bg: "bg-yellow-600", text: "text-white", icon: "⚠️", label: "Expiring" },
    overdue: { bg: "bg-red-600", text: "text-white", icon: "🚨", label: "Overdue" },
    inactive: { bg: "bg-gray-600", text: "text-white", icon: "⚫", label: "Inactive" }
  };

  const config = statusConfig[status] || statusConfig.inactive;

  return (
    <div className="bg-gray-750 rounded-xl p-5 border border-gray-600 shadow-lg">
      {/* Student Header - Enhanced spacing */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {/* Avatar with improved sizing */}
          <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {studentName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-base truncate">{studentName}</h3>
            <p className="text-gray-400 text-sm truncate">{studentEmail}</p>
            <p className="text-gray-400 text-sm">{studentPhone}</p>
          </div>
        </div>
        
        {/* Status badges with enhanced styling */}
        <div className="flex-shrink-0 text-right space-y-1">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
            <span className="mr-1">{config.icon}</span>
            {config.label}
          </div>
          {isLegacy && (
            <div className="block">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-600 text-white">
                ⭐ Legacy
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Student Details - Enhanced layout */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Rate</p>
          <p className="text-white font-semibold">₱{monthlyRate.toLocaleString()}</p>
          <p className="text-gray-400 text-xs">per month</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Due Date</p>
          <p className={`text-sm font-medium ${dueDateInfo.color}`}>
            {dueDateInfo.text}
          </p>
        </div>
      </div>

      {/* Enhanced Mobile-Optimized Action Buttons */}
      <div className="space-y-3">
        {/* Primary Actions - 3-column grid with proper touch targets */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => onViewStudent && onViewStudent(student.id)}
            className="flex flex-col items-center justify-center py-3 px-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-medium rounded-lg transition-all duration-200 min-h-[52px] transform active:scale-95"
          >
            <span className="text-lg mb-1">👁️</span>
            <span>View</span>
          </button>
          <button
            onClick={() => onEditStudent && onEditStudent(student)}
            className="flex flex-col items-center justify-center py-3 px-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-xs font-medium rounded-lg transition-all duration-200 min-h-[52px] transform active:scale-95"
          >
            <span className="text-lg mb-1">✏️</span>
            <span>Edit</span>
          </button>
          <button
            onClick={() => onProcessPayment && onProcessPayment(student)}
            className="flex flex-col items-center justify-center py-3 px-2 bg-yellow-600 hover:bg-yellow-700 active:bg-yellow-800 text-white text-xs font-medium rounded-lg transition-all duration-200 min-h-[52px] transform active:scale-95"
          >
            <span className="text-lg mb-1">💳</span>
            <span>Pay</span>
          </button>
        </div>
        
        {/* SMS Button - Full width if eligible */}
        {canSendSMS && (
          <button
            onClick={() => onSendReminder && onSendReminder(student)}
            disabled={smsLoading}
            className="w-full flex items-center justify-center py-3 px-4 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-sm font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-[52px] transform active:scale-95"
          >
            <span className="mr-2 text-lg">{smsLoading ? "⏳" : "📱"}</span>
            <span>{smsLoading ? "Sending SMS..." : "Send SMS Reminder"}</span>
          </button>
        )}
      </div>
    </div>
  );
};

// Lines 215-340: Enhanced Desktop Table Row Component
const StudentTableRow = ({ 
  student, 
  onProcessPayment, 
  onViewStudent, 
  onEditStudent, 
  onSendReminder, 
  canSendReminder, 
  smsLoading 
}) => {
  // Input validation
  if (!student || typeof student !== 'object') {
    return null;
  }

  // Safe data extraction
  const studentName = String(student.name || 'Unknown Student');
  const studentEmail = String(student.email || 'No email');
  const studentPhone = String(student.phone || student.phoneNumber || 'No phone');
  const monthlyRate = parseFloat(student.monthlyRate || student.rate || 1400);
  const isLegacy = student.isLegacyStudent || monthlyRate < 1400;

  // Use safe calculations
  const status = getSafeStudentStatus(student);
  const latestMembership = getSafeLatestMembership(student);
  const dueDateInfo = latestMembership?.endDate 
    ? formatSafeDueDate(latestMembership.endDate)
    : { text: "No membership", color: "text-gray-400" };

  // SMS eligibility check
  const canSendSMS = canSendReminder ? canSendReminder(student) : (
    (status === 'expiring' || status === 'overdue') && 
    Boolean(student.phone || student.phoneNumber)
  );

  // Status configuration
  const statusConfig = {
    active: { bg: "bg-green-600", text: "text-white", icon: "✅", label: "Active" },
    expiring: { bg: "bg-yellow-600", text: "text-white", icon: "⚠️", label: "Expiring" },
    overdue: { bg: "bg-red-600", text: "text-white", icon: "🚨", label: "Overdue" },
    inactive: { bg: "bg-gray-600", text: "text-white", icon: "⚫", label: "Inactive" }
  };

  const config = statusConfig[status] || statusConfig.inactive;

  return (
    <tr className="hover:bg-gray-750 transition-colors duration-200">
      {/* Student Information Cell */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-12 w-12">
            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
              {studentName.charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-semibold text-white">
              {studentName}
            </div>
            <div className="text-sm text-gray-400">
              {studentEmail}
            </div>
            <div className="text-xs text-gray-500">
              📞 {studentPhone}
            </div>
          </div>
        </div>
      </td>
      
      {/* Status Cell */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
            <span className="mr-1">{config.icon}</span>
            {config.label}
          </span>
          {isLegacy && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-600 text-white">
              ⭐ Legacy
            </span>
          )}
        </div>
      </td>
      
      {/* Membership Cell */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-white">MONTHLY</div>
        <div className="text-lg font-bold text-white">
          ₱{monthlyRate.toLocaleString()}/mo
        </div>
        {latestMembership?.startDate && (
          <div className="text-xs text-gray-500">
            Started: {safeDateParse(latestMembership.startDate)?.toLocaleDateString() || 'N/A'}
          </div>
        )}
      </td>
      
      {/* Due Date Cell */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`text-sm font-medium ${dueDateInfo.color}`}>
          {dueDateInfo.text}
        </span>
        {latestMembership?.endDate && (
          <div className="text-xs text-gray-500">
            End: {safeDateParse(latestMembership.endDate)?.toLocaleDateString() || 'N/A'}
          </div>
        )}
      </td>
      
      {/* Actions Cell */}
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center justify-end space-x-2">
          <button
            onClick={() => onViewStudent && onViewStudent(student.id)}
            className="text-blue-400 hover:text-blue-300 p-2 rounded-lg hover:bg-gray-700 transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="View Student Details"
          >
            <span className="text-lg">👁️</span>
          </button>
          
          <button
            onClick={() => onEditStudent && onEditStudent(student)}
            className="text-green-400 hover:text-green-300 p-2 rounded-lg hover:bg-gray-700 transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Edit Student Information"
          >
            <span className="text-lg">✏️</span>
          </button>
          
          <button
            onClick={() => onProcessPayment && onProcessPayment(student)}
            className="text-yellow-400 hover:text-yellow-300 p-2 rounded-lg hover:bg-gray-700 transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Process Payment"
          >
            <span className="text-lg">💳</span>
          </button>
          
          {canSendSMS && (
            <button
              onClick={() => onSendReminder && onSendReminder(student)}
              disabled={smsLoading}
              className="text-purple-400 hover:text-purple-300 p-2 rounded-lg hover:bg-gray-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] min-w-[44px] flex items-center justify-center"
              title={`Send SMS Reminder to ${studentName}`}
            >
              <span className="text-lg">{smsLoading ? "⏳" : "📱"}</span>
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

// Lines 345-500: Enhanced Main Student Management Section Component
const StudentManagementSection = ({
  filteredStudents,
  students,
  tabCounts,
  currentTab,
  searchQuery,
  isSearchActive,
  setCurrentTab,
  setSearchQuery,
  setIsSearchActive,
  setAddStudentModalOpen,
  onProcessPayment,
  onViewStudent,
  onEditStudent,
  onSendReminder,
  canSendReminder,
  getStudentStatus, // May be passed but we use safe internal version
  getDaysRemaining, // May be passed but we use safe internal version
  smsLoading = false,
}) => {
  // Tab configuration with proper counts
  const tabs = [
    { id: "all", label: "All Students", count: tabCounts.all || 0 },
    { id: "active", label: "Active", count: tabCounts.active || 0 },
    { id: "expiring", label: "Expiring Soon", count: tabCounts.expiring || 0 },
    { id: "overdue", label: "Overdue", count: tabCounts.overdue || 0 },
    { id: "inactive", label: "Inactive", count: tabCounts.inactive || 0 },
  ];

  // Handle search input changes
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setIsSearchActive(value.trim().length > 0);
  };

  // Clear search functionality
  const handleClearSearch = () => {
    setSearchQuery("");
    setIsSearchActive(false);
  };

  return (
    <div className="bg-gray-800 shadow-xl rounded-xl overflow-hidden border border-gray-700">
      {/* Enhanced Section Header - Mobile-First */}
      <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-4 sm:px-6 py-4 border-b border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-lg sm:text-xl font-bold text-white">Student Management</h2>
            <p className="text-gray-400 text-sm mt-1">
              Manage student memberships, payments, and SMS reminders
            </p>
          </div>
          {/* Enhanced Add Student Button - Full width on mobile */}
          <button
            onClick={() => setAddStudentModalOpen(true)}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-6 py-3 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 min-h-[52px] font-medium transform active:scale-95"
          >
            <span className="text-lg">➕</span>
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Enhanced Search and Filter Controls */}
      <div className="px-4 sm:px-6 py-4 bg-gray-750 border-b border-gray-700 space-y-4">
        {/* Enhanced Mobile-Optimized Search Input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search students by name, email, or phone..."
            value={searchQuery || ''}
            onChange={handleSearchChange}
            className="block w-full pl-12 pr-12 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base min-h-[52px] transition-all duration-200"
          />
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <span className="text-gray-400 text-lg">🔍</span>
          </div>
          {isSearchActive && (
            <button
              onClick={handleClearSearch}
              className="absolute inset-y-0 right-0 pr-4 flex items-center min-h-[52px] min-w-[52px] justify-center transition-colors duration-200"
            >
              <span className="text-gray-400 hover:text-white text-lg">❌</span>
            </button>
          )}
        </div>

        {/* Enhanced Mobile-First Tab Navigation - Horizontal Scroll */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 px-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap min-h-[48px] transform active:scale-95 ${
                currentTab === tab.id
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-gray-700 text-gray-300 hover:text-white hover:bg-gray-600"
              }`}
            >
              <div className="text-center">
                <div className="font-medium">{tab.label}</div>
                <div className="text-xs opacity-75">({tab.count})</div>
              </div>
            </button>
          ))}
        </div>

        {/* Active Filters Display - Enhanced */}
        {(isSearchActive || currentTab !== "all") && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-gray-400">Active filters:</span>
            {isSearchActive && (
              <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs">
                Search: "{searchQuery}"
              </span>
            )}
            {currentTab !== "all" && (
              <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs">
                Status: {tabs.find(t => t.id === currentTab)?.label}
              </span>
            )}
            <button
              onClick={() => {
                setCurrentTab("all");
                handleClearSearch();
              }}
              className="text-blue-400 hover:text-blue-300 text-xs underline ml-2 transition-colors duration-200"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Enhanced Results Summary */}
      <div className="px-4 sm:px-6 py-3 bg-gray-750 border-b border-gray-700">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-300 font-medium">
            Showing {filteredStudents.length} of {students.length} students
          </span>
          {smsLoading && (
            <span className="text-yellow-400 flex items-center space-x-2 animate-pulse">
              <span className="text-lg">📱</span>
              <span>Sending SMS...</span>
            </span>
          )}
        </div>
      </div>

      {/* Enhanced Student List - Mobile-First with Desktop Fallback */}
      {filteredStudents.length > 0 ? (
        <>
          {/* Mobile Cards View - Enhanced with better breakpoint */}
          <div className="block lg:hidden">
            <div className="p-4 space-y-4">
              {filteredStudents.map((student) => (
                <StudentCard
                  key={student.id}
                  student={student}
                  onProcessPayment={onProcessPayment}
                  onViewStudent={onViewStudent}
                  onEditStudent={onEditStudent}
                  onSendReminder={onSendReminder}
                  canSendReminder={canSendReminder}
                  smsLoading={smsLoading}
                />
              ))}
            </div>
          </div>

          {/* Desktop Table View - Enhanced */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Student Information
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Membership
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {filteredStudents.map((student) => (
                  <StudentTableRow
                    key={student.id}
                    student={student}
                    onProcessPayment={onProcessPayment}
                    onViewStudent={onViewStudent}
                    onEditStudent={onEditStudent}
                    onSendReminder={onSendReminder}
                    canSendReminder={canSendReminder}
                    smsLoading={smsLoading}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* Enhanced Empty State */
        <div className="p-8 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-white mb-2">
            {isSearchActive || currentTab !== "all" ? 'No students found' : 'No students yet'}
          </h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            {isSearchActive || currentTab !== "all" 
              ? "Try adjusting your search terms or filter criteria to find what you're looking for."
              : "Get started by adding your first student to begin managing memberships and payments."
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            {(isSearchActive || currentTab !== "all") && (
              <button
                onClick={() => {
                  setCurrentTab("all");
                  handleClearSearch();
                }}
                className="text-blue-400 hover:text-blue-300 underline text-sm transition-colors duration-200"
              >
                Clear all filters
              </button>
            )}
            <button
              onClick={() => setAddStudentModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-6 py-3 rounded-lg font-medium min-h-[48px] transition-all duration-200 transform active:scale-95"
            >
              {students.length === 0 ? 'Add First Student' : 'Add Student'}
            </button>
          </div>
        </div>
      )}

      {/* Mobile Bottom Safe Area */}
      <div className="h-6 lg:hidden" />
    </div>
  );
};

export default StudentManagementSection;

/* CSS Styles to add to your global stylesheet or component styles */
const additionalStyles = `
/* Scrollbar Hide Utility */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

/* Touch-friendly active states for mobile */
@media (hover: none) and (pointer: coarse) {
  .transform.active\\:scale-95:active {
    transform: scale(0.95);
  }
}

/* Enhanced focus states for accessibility */
button:focus-visible {
  outline: 2px solid #3B82F6;
  outline-offset: 2px;
}

/* Smooth animations */
* {
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
`;