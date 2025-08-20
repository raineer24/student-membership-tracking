// File: client/src/components/dashboard/StudentManagementSection.jsx
// Line 1: MOBILE-FIRST RESPONSIVE STUDENT MANAGEMENT - Cards on mobile, table on desktop
import React from "react";

// Line 4: MOBILE-OPTIMIZED STUDENT CARD - Touch-friendly with all functionality
const StudentCard = ({ 
  student, 
  onProcessPayment, 
  onViewStudent, 
  onEditStudent, 
  onSendReminder, 
  canSendReminder, 
  getStudentStatus, 
  getDaysRemaining,
  smsLoading 
}) => {
  const status = getStudentStatus(student);
  const daysRemaining = getDaysRemaining(student);
  const hasPhone = Boolean(student.phone || student.phoneNumber);
  const canSendSMS = canSendReminder && canSendReminder(student) && hasPhone;

  // Status styling
  const statusConfig = {
    active: { bg: "bg-green-100", text: "text-green-800", emoji: "✅" },
    expiring: { bg: "bg-yellow-100", text: "text-yellow-800", emoji: "⚠️" },
    overdue: { bg: "bg-red-100", text: "text-red-800", emoji: "🚨" },
    inactive: { bg: "bg-gray-100", text: "text-gray-800", emoji: "⭕" }
  };

  const config = statusConfig[status] || statusConfig.inactive;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      {/* Header Row - Name and Status */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-medium text-gray-900 truncate">
            {student.name}
          </h3>
          <p className="text-sm text-gray-600 truncate">{student.email}</p>
        </div>
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} ml-2`}>
          <span className="mr-1">{config.emoji}</span>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>

      {/* Student Details */}
      <div className="space-y-2 mb-4">
        {/* Phone Number */}
        {hasPhone && (
          <div className="flex items-center text-sm text-gray-600">
            <span className="mr-2">📱</span>
            <span>{student.phone || student.phoneNumber}</span>
          </div>
        )}

        {/* Monthly Rate */}
        <div className="flex items-center text-sm text-gray-600">
          <span className="mr-2">💰</span>
          <span>₱{(student.monthlyRate || student.rate || 1400).toLocaleString()}/month</span>
          {student.isLegacyStudent && (
            <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
              🌟 Legacy
            </span>
          )}
        </div>

        {/* Due Date */}
        <div className="flex items-center text-sm">
          <span className="mr-2">📅</span>
          <span className={
            status === 'overdue' ? 'text-red-600 font-medium' :
            status === 'expiring' ? 'text-yellow-600 font-medium' :
            'text-gray-600'
          }>
            {status === 'overdue' ? `${Math.abs(daysRemaining)} days overdue` :
             status === 'expiring' ? `${daysRemaining} days remaining` :
             status === 'active' ? `${daysRemaining} days remaining` :
             'No active membership'}
          </span>
        </div>
      </div>

      {/* Action Buttons - Mobile-optimized grid */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => onViewStudent(student.id)}
          className="flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors min-h-[40px]"
        >
          <span className="mr-1">👁️</span>
          <span>View</span>
        </button>
        
        <button
          onClick={() => onEditStudent(student)}
          className="flex items-center justify-center px-3 py-2 bg-gray-600 text-white text-xs rounded-lg hover:bg-gray-700 transition-colors min-h-[40px]"
        >
          <span className="mr-1">✏️</span>
          <span>Edit</span>
        </button>
        
        <button
          onClick={() => onProcessPayment(student)}
          className="flex items-center justify-center px-3 py-2 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors min-h-[40px]"
        >
          <span className="mr-1">💳</span>
          <span>Pay</span>
        </button>
      </div>

      {/* SMS Button - Full width if available */}
      {canSendSMS && (
        <button
          onClick={() => onSendReminder(student)}
          disabled={smsLoading}
          className="w-full mt-2 flex items-center justify-center px-3 py-2 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 min-h-[40px]"
        >
          <span className="mr-1">{smsLoading ? "⏳" : "📱"}</span>
          <span>{smsLoading ? "Sending..." : "Send SMS"}</span>
        </button>
      )}
    </div>
  );
};

// Line 96: DESKTOP TABLE ROW - Preserved existing functionality
const StudentTableRow = ({ 
  student, 
  onProcessPayment, 
  onViewStudent, 
  onEditStudent, 
  onSendReminder, 
  canSendReminder, 
  getStudentStatus, 
  getDaysRemaining,
  smsLoading 
}) => {
  const status = getStudentStatus(student);
  const daysRemaining = getDaysRemaining(student);
  const hasPhone = Boolean(student.phone || student.phoneNumber);
  const canSendSMS = canSendReminder && canSendReminder(student) && hasPhone;

  // Status styling
  const statusConfig = {
    active: { bg: "bg-green-100", text: "text-green-800", emoji: "✅" },
    expiring: { bg: "bg-yellow-100", text: "text-yellow-800", emoji: "⚠️" },
    overdue: { bg: "bg-red-100", text: "text-red-800", emoji: "🚨" },
    inactive: { bg: "bg-gray-100", text: "text-gray-800", emoji: "⭕" }
  };

  const config = statusConfig[status] || statusConfig.inactive;

  return (
    <tr className="hover:bg-gray-50">
      {/* Student Information */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div>
            <div className="text-sm font-medium text-gray-900">{student.name}</div>
            <div className="text-sm text-gray-500">{student.email}</div>
            {hasPhone && (
              <div className="text-xs text-gray-400">{student.phone || student.phoneNumber}</div>
            )}
            <div className="text-xs text-gray-500 mt-1">
              ₱{(student.monthlyRate || student.rate || 1400).toLocaleString()}/mo
              {student.isLegacyStudent && (
                <span className="ml-2 text-purple-600">🌟 Legacy</span>
              )}
            </div>
          </div>
        </div>
      </td>

      {/* Status */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
          <span className="mr-1">{config.emoji}</span>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
        {student.isLegacyStudent && (
          <div className="mt-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              🌟 Legacy
            </span>
          </div>
        )}
      </td>

      {/* Membership Type */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">
          {student.latestMembership?.type || "MONTHLY"}
        </div>
        {student.latestMembership?.startDate && (
          <div className="text-xs text-gray-500">
            Started: {new Date(student.latestMembership.startDate).toLocaleDateString()}
          </div>
        )}
      </td>

      {/* Due Date */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`text-sm ${
          status === 'overdue' ? 'text-red-600 font-medium' :
          status === 'expiring' ? 'text-yellow-600 font-medium' :
          'text-gray-900'
        }`}>
          {status === 'overdue' ? `${Math.abs(daysRemaining)} days overdue` :
           status === 'expiring' ? `${daysRemaining} days remaining` :
           status === 'active' ? `${daysRemaining} days remaining` :
           'No active membership'}
        </span>
      </td>

      {/* Actions */}
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center justify-end space-x-2">
          <button
            onClick={() => onViewStudent(student.id)}
            className="text-blue-600 hover:text-blue-900 p-1 rounded transition-colors"
            title="View Student"
          >
            👁️
          </button>
          
          <button
            onClick={() => onEditStudent(student)}
            className="text-gray-600 hover:text-gray-900 p-1 rounded transition-colors"
            title="Edit Student"
          >
            ✏️
          </button>
          
          <button
            onClick={() => onProcessPayment(student)}
            className="text-green-600 hover:text-green-900 p-1 rounded transition-colors"
            title="Process Payment"
          >
            💳
          </button>
          
          {canSendSMS && (
            <button
              onClick={() => onSendReminder(student)}
              disabled={smsLoading}
              className="text-purple-600 hover:text-purple-900 p-1 rounded transition-colors disabled:opacity-50"
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

// Line 205: MAIN COMPONENT - Mobile-first responsive design
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
  getStudentStatus,
  getDaysRemaining,
  smsLoading = false,
}) => {
  // Line 225: Tab configuration with proper counts
  const tabs = [
    { id: "all", label: "All Students", count: tabCounts.all },
    { id: "active", label: "Active", count: tabCounts.active },
    { id: "expiring", label: "Expiring Soon", count: tabCounts.expiring },
    { id: "overdue", label: "Overdue", count: tabCounts.overdue },
    { id: "inactive", label: "Inactive", count: tabCounts.inactive },
  ];

  // Line 234: Handle search input changes
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setIsSearchActive(value.trim().length > 0);
  };

  // Line 241: Clear search functionality
  const handleClearSearch = () => {
    setSearchQuery("");
    setIsSearchActive(false);
  };

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      {/* Header Section - Mobile-optimized */}
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="mb-4 sm:mb-0">
            <h3 className="text-lg font-medium text-gray-900">Students</h3>
            <p className="text-sm text-gray-500 mt-1">
              Manage student memberships, payments, and SMS reminders
            </p>
          </div>
          <div className="flex-shrink-0">
            <button
              onClick={() => setAddStudentModalOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium min-h-[44px]"
            >
              <span className="mr-2">➕</span>
              <span>Add Student</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters - Mobile-first layout */}
      <div className="px-4 py-4 sm:px-6 bg-gray-50 border-b border-gray-200">
        {/* Search Input - Full width on mobile */}
        <div className="mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search students by name, email, or phone..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation - Horizontal scroll on mobile */}
        <div className="flex space-x-1 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentTab === tab.id
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-300"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Active Filters Display */}
        {(isSearchActive || currentTab !== "all") && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-gray-500">Active filters:</span>
            {isSearchActive && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                Search: "{searchQuery}"
              </span>
            )}
            {currentTab !== "all" && (
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                Status: {tabs.find(t => t.id === currentTab)?.label}
              </span>
            )}
            <button
              onClick={() => {
                setCurrentTab("all");
                handleClearSearch();
              }}
              className="text-blue-600 hover:text-blue-800 ml-2"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="px-4 py-3 sm:px-6 bg-gray-50 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
          <span className="text-sm text-gray-600 mb-2 sm:mb-0">
            Showing {filteredStudents.length} of {students.length} students
          </span>
          {smsLoading && (
            <span className="text-yellow-600 flex items-center space-x-2 text-sm">
              <span>📱</span>
              <span>Sending SMS...</span>
            </span>
          )}
        </div>
      </div>

      {/* Student List - Mobile: Cards, Desktop: Table */}
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
                  getStudentStatus={getStudentStatus}
                  getDaysRemaining={getDaysRemaining}
                  smsLoading={smsLoading}
                />
              ))}
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student Information
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Membership
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <StudentTableRow
                    key={student.id}
                    student={student}
                    onProcessPayment={onProcessPayment}
                    onViewStudent={onViewStudent}
                    onEditStudent={onEditStudent}
                    onSendReminder={onSendReminder}
                    canSendReminder={canSendReminder}
                    getStudentStatus={getStudentStatus}
                    getDaysRemaining={getDaysRemaining}
                    smsLoading={smsLoading}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* Empty State - Mobile-friendly */
        <div className="p-8 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
          <p className="text-gray-500 mb-4">
            {isSearchActive || currentTab !== "all" ? 
              "Try adjusting your search or filters." : 
              "Get started by adding your first student."
            }
          </p>
          {(!isSearchActive && currentTab === "all") && (
            <button
              onClick={() => setAddStudentModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Student
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentManagementSection;