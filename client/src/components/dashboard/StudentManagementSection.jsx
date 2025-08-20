// File: client/src/components/dashboard/StudentManagementSection.jsx
// Lines 1-20: FINAL FIX - Student Management with NaN Prevention
import React from "react";

/**
 * StudentManagementSection Component - PRODUCTION READY
 * Complete student management with safe date calculations
 * 
 * CRITICAL FIXES APPLIED:
 * - Eliminated all NaN date calculation errors
 * - Safe string operations throughout
 * - Inline safe date utilities to avoid import issues
 * - Enhanced error handling for all edge cases
 * - No console logging for production
 */

// Lines 25-100: SAFE DATE UTILITIES - Inline to prevent import issues
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

// Lines 105-200: SAFE STUDENT CARD COMPONENT - Mobile View
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
    active: { bg: "bg-green-600", text: "text-white", emoji: "✅", label: "Active" },
    expiring: { bg: "bg-yellow-600", text: "text-white", emoji: "⚠️", label: "Expiring" },
    overdue: { bg: "bg-red-600", text: "text-white", emoji: "🚨", label: "Overdue" },
    inactive: { bg: "bg-gray-600", text: "text-white", emoji: "⚫", label: "Inactive" }
  };

  const config = statusConfig[status] || statusConfig.inactive;

  return (
    <div className="bg-gray-750 rounded-lg p-4 border border-gray-600">
      {/* Student Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
            {studentName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-white font-medium">{studentName}</h3>
            <p className="text-gray-400 text-sm">{studentEmail}</p>
          </div>
        </div>
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
          <span className="mr-1">{config.emoji}</span>
          {config.label}
        </span>
      </div>

      {/* Student Details */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Phone:</span>
          <span className="text-white">{studentPhone}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Rate:</span>
          <span className="text-white">
            ₱{monthlyRate.toLocaleString()}/mo
            {isLegacy && <span className="ml-2 text-purple-400">⭐ Legacy</span>}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Due Date:</span>
          <span className={dueDateInfo.color}>{dueDateInfo.text}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <button
          onClick={() => onViewStudent && onViewStudent(student.id)}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition-colors"
        >
          👁️ View
        </button>
        <button
          onClick={() => onEditStudent && onEditStudent(student)}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm transition-colors"
        >
          ✏️ Edit
        </button>
        <button
          onClick={() => onProcessPayment && onProcessPayment(student)}
          className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded text-sm transition-colors"
        >
          💳 Pay
        </button>
        {canSendSMS && (
          <button
            onClick={() => onSendReminder && onSendReminder(student)}
            disabled={smsLoading}
            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded text-sm transition-colors disabled:opacity-50"
          >
            {smsLoading ? "⏳" : "📱"}
          </button>
        )}
      </div>
    </div>
  );
};

// Lines 205-320: SAFE STUDENT TABLE ROW COMPONENT - Desktop View
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
    active: { bg: "bg-green-600", text: "text-white", emoji: "✅", label: "Active" },
    expiring: { bg: "bg-yellow-600", text: "text-white", emoji: "⚠️", label: "Expiring" },
    overdue: { bg: "bg-red-600", text: "text-white", emoji: "🚨", label: "Overdue" },
    inactive: { bg: "bg-gray-600", text: "text-white", emoji: "⚫", label: "Inactive" }
  };

  const config = statusConfig[status] || statusConfig.inactive;

  return (
    <tr className="hover:bg-gray-750 transition-colors">
      {/* Student Information Cell */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
              {studentName.charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-white">
              {studentName}
            </div>
            <div className="text-sm text-gray-400">
              {studentEmail}
            </div>
            <div className="text-xs text-gray-500">
              {studentPhone}
            </div>
          </div>
        </div>
      </td>
      
      {/* Status Cell */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
            <span className="mr-1">{config.emoji}</span>
            {config.label}
          </span>
          {isLegacy && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-600 text-white">
              ⭐ Legacy
            </span>
          )}
        </div>
      </td>
      
      {/* Membership Cell */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-white">MONTHLY</div>
        <div className="text-sm text-gray-400">
          ₱{monthlyRate.toLocaleString()}/mo
        </div>
        {latestMembership?.startDate && (
          <div className="text-xs text-gray-500">
            Started: {safeDateParse(latestMembership.startDate)?.toLocaleDateString() || 'N/A'}
          </div>
        )}
      </td>
      
      {/* Due Date Cell - FIXED: No more NaN errors */}
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
            className="text-blue-400 hover:text-blue-300 p-2 rounded-lg hover:bg-gray-700 transition-all duration-200"
            title="View Student Details"
          >
            👁️
          </button>
          
          <button
            onClick={() => onEditStudent && onEditStudent(student)}
            className="text-green-400 hover:text-green-300 p-2 rounded-lg hover:bg-gray-700 transition-all duration-200"
            title="Edit Student Information"
          >
            ✏️
          </button>
          
          <button
            onClick={() => onProcessPayment && onProcessPayment(student)}
            className="text-yellow-400 hover:text-yellow-300 p-2 rounded-lg hover:bg-gray-700 transition-all duration-200"
            title="Process Payment"
          >
            💳
          </button>
          
          {canSendSMS && (
            <button
              onClick={() => onSendReminder && onSendReminder(student)}
              disabled={smsLoading}
              className="text-purple-400 hover:text-purple-300 p-2 rounded-lg hover:bg-gray-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title={`Send SMS Reminder to ${studentName}`}
            >
              {smsLoading ? "⏳" : "📱"}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

// Lines 325-500: MAIN STUDENT MANAGEMENT SECTION COMPONENT
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
    <div className="bg-gray-800 shadow-xl rounded-xl overflow-hidden">
      {/* Section Header */}
      <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-6 py-4 border-b border-gray-700">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-white">Student Management</h2>
            <p className="text-gray-400 text-sm mt-1">
              Manage student memberships, payments, and SMS reminders
            </p>
          </div>
          <button
            onClick={() => setAddStudentModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
          >
            <span>➕</span>
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="px-6 py-4 bg-gray-750 border-b border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400">🔍</span>
              </div>
              <input
                type="text"
                placeholder="Search students by name, email, or phone..."
                value={searchQuery || ''}
                onChange={handleSearchChange}
                className="block w-full pl-10 pr-10 py-2 border border-gray-600 rounded-md leading-5 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:placeholder-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {isSearchActive && (
                <button
                  onClick={handleClearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200"
                >
                  ❌
                </button>
              )}
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex space-x-1 bg-gray-700 p-1 rounded-lg">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  currentTab === tab.id
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:text-white hover:bg-gray-600"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Active Filters Display */}
        {(isSearchActive || currentTab !== "all") && (
          <div className="mt-3 flex items-center space-x-2 text-sm">
            <span className="text-gray-400">Active filters:</span>
            {isSearchActive && (
              <span className="bg-blue-600 text-white px-2 py-1 rounded">
                Search: "{searchQuery}"
              </span>
            )}
            {currentTab !== "all" && (
              <span className="bg-purple-600 text-white px-2 py-1 rounded">
                Status: {tabs.find(t => t.id === currentTab)?.label}
              </span>
            )}
            <button
              onClick={() => {
                setCurrentTab("all");
                handleClearSearch();
              }}
              className="text-blue-400 hover:text-blue-300 ml-2"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="px-6 py-3 bg-gray-750 border-b border-gray-700">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-300">
            Showing {filteredStudents.length} of {students.length} students
          </span>
          {smsLoading && (
            <span className="text-yellow-400 flex items-center space-x-2">
              <span>📱</span>
              <span>Sending SMS...</span>
            </span>
          )}
        </div>
      </div>

      {/* Student List - FIXED: Using safe components */}
      {filteredStudents.length > 0 ? (
        <>
          {/* Mobile Cards View */}
          <div className="block sm:hidden">
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

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Student Information
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Membership
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
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
        /* Empty State */
        <div className="p-8 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-white mb-2">No students found</h3>
          <p className="text-gray-400 mb-4">
            {isSearchActive || currentTab !== "all" 
              ? "Try adjusting your search or filter criteria"
              : "Get started by adding your first student"
            }
          </p>
          <button
            onClick={() => {
              setCurrentTab("all");
              handleClearSearch();
            }}
            className="text-blue-400 hover:text-blue-300 mr-4"
          >
            Clear filters
          </button>
          <button
            onClick={() => setAddStudentModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Add First Student
          </button>
        </div>
      )}
    </div>
  );
};

export default StudentManagementSection;