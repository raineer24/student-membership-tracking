// File: client/src/components/dashboard/StudentManagementSection.jsx
// Lines 1-15: Component for student management table and controls
// Extracted from DashboardPage.jsx lines 585-860
import React from 'react';
import StudentTableRow from '../student/StudentTableRow';

/**
 * StudentManagementSection Component
 * Manages student table display with search, filtering, and actions
 * Follows SOLID principles with single responsibility for student display
 * 
 * @param {Object} props - Component props
 * @param {Array} props.filteredStudents - Filtered student data
 * @param {Object} props.tabCounts - Student counts by status
 * @param {Object} props.pricingBreakdown - Revenue calculations
 * @param {string} props.currentTab - Active tab filter
 * @param {string} props.searchQuery - Current search query
 * @param {boolean} props.isSearchActive - Search state
 * @param {boolean} props.smsLoading - SMS operation loading state
 * @param {Function} props.setCurrentTab - Tab change handler
 * @param {Function} props.setSearchQuery - Search query handler
 * @param {Function} props.setIsSearchActive - Search state handler
 * @param {Function} props.setAddStudentModalOpen - Add student modal handler
 * @param {Function} props.onProcessPayment - Payment processing handler
 * @param {Function} props.onViewStudent - Student view handler
 * @param {Function} props.onEditStudent - Student edit handler
 * @param {Function} props.onSendReminder - SMS reminder handler
 * @param {Function} props.canSendReminder - Check if reminder can be sent
 * @param {Function} props.getStudentStatus - Get student status
 */
const StudentManagementSection = ({
  filteredStudents = [],
  students = [],
  tabCounts = {},
  pricingBreakdown = {},
  currentTab = "all",
  searchQuery = "",
  isSearchActive = false,
  smsLoading = false,
  setCurrentTab,
  setSearchQuery,
  setIsSearchActive,
  setAddStudentModalOpen,
  onProcessPayment,
  onViewStudent,
  onEditStudent,
  onSendReminder,
  canSendReminder,
  getStudentStatus
}) => {
  // Lines 35-55: Tab configuration following DRY principle
  const tabsConfig = [
    { key: "all", label: "All", icon: "👥" },
    { key: "active", label: "Active", icon: "✅" },
    { key: "expiring", label: "Expiring", icon: "⚠️" },
    { key: "overdue", label: "Overdue", icon: "🚨" },
    { key: "inactive", label: "Inactive", icon: "⭕" }
  ];

  // Lines 60-80: Search handlers following KISS principle
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setIsSearchActive(value.trim().length > 0);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setIsSearchActive(false);
  };

  // Lines 85-300: Main render
  return (
    <div className="bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-xl border border-gray-600 overflow-hidden shadow-xl">
      {/* Header Section */}
      <div className="px-6 py-4 border-b border-gray-600">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <span className="mr-2">👨‍🎓</span>
            Student Management
          </h2>
          
          {/* Search and Add Student Controls */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search students..."
                className="w-full sm:w-64 pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {isSearchActive && (
                <button
                  onClick={handleClearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg className="h-5 w-5 text-gray-400 hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            
            {/* Add Student Button */}
            <button
              onClick={() => setAddStudentModalOpen(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
            >
              <span className="mr-2">➕</span>
              Add Student
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-4 flex flex-wrap gap-2">
          {tabsConfig.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setCurrentTab(key)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors flex items-center space-x-1 ${
                currentTab === key
                  ? "bg-red-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
              }`}
            >
              <span>{icon}</span>
              <span>{label}</span>
              <span className="ml-1 bg-gray-600 text-xs px-2 py-0.5 rounded-full">
                {tabCounts[key] || 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Student Table */}
      <div className="overflow-x-auto">
        {filteredStudents.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-600">
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
            <tbody className="bg-gray-800 divide-y divide-gray-600">
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
                  getStudentStatus={getStudentStatus}
                />
              ))}
            </tbody>
          </table>
        ) : (
          // Empty State Component
          <div className="text-center py-12">
            <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-400 mb-2">
              {isSearchActive ? "No students found" : "No students yet"}
            </h3>
            <p className="text-gray-500 mb-4">
              {isSearchActive 
                ? `No students match "${searchQuery}". Try adjusting your search.`
                : "Get started by adding your first student to the academy."
              }
            </p>
            {isSearchActive ? (
              <button
                onClick={handleClearSearch}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Clear Search
              </button>
            ) : (
              <button
                onClick={() => setAddStudentModalOpen(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Add First Student
              </button>
            )}
          </div>
        )}
      </div>

      {/* Results Summary */}
      {filteredStudents.length > 0 && (
        <div className="px-6 py-3 bg-gray-700 bg-opacity-50 border-t border-gray-600">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-400">
            <div>
              Showing {filteredStudents.length} of {students.length} students
              {isSearchActive && (
                <span className="ml-2 text-blue-400">
                  (filtered by "{searchQuery}")
                </span>
              )}
              {currentTab !== "all" && (
                <span className="ml-2 text-yellow-400">
                  (filtered by {currentTab} status)
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4 mt-2 sm:mt-0">
              <span>Total Revenue: ${pricingBreakdown.totalMonthly?.toLocaleString() || 0}/month</span>
              <span>Avg: ${filteredStudents.length > 0 ? Math.round((pricingBreakdown.totalMonthly || 0) / filteredStudents.length) : 0}/student</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagementSection;