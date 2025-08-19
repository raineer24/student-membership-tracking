// File: client/src/components/dashboard/StudentManagementSection.jsx
// Line 1: ENHANCED - Student Management with SMS Reminder Integration
import React from "react";
import StudentTableRow from "../student/StudentTableRow";

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
  onSendReminder, // FIXED: Added SMS reminder handler
  canSendReminder, // FIXED: Added SMS eligibility checker
  getStudentStatus,
  getDaysRemaining,
  smsLoading = false, // FIXED: Added SMS loading state
}) => {
  // Line 25: Tab configuration with proper counts
  const tabs = [
    { id: "all", label: "All Students", count: tabCounts.all },
    { id: "active", label: "Active", count: tabCounts.active },
    { id: "expiring", label: "Expiring Soon", count: tabCounts.expiring },
    { id: "overdue", label: "Overdue", count: tabCounts.overdue },
    { id: "inactive", label: "Inactive", count: tabCounts.inactive },
  ];

  // Line 34: Handle search input changes
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setIsSearchActive(value.trim().length > 0);
  };

  // Line 41: Clear search functionality
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
                value={searchQuery}
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

      {/* Student Table */}
      <div className="overflow-x-auto">
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
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <StudentTableRow
                  key={student.id}
                  student={student}
                  onProcessPayment={onProcessPayment}
                  onViewStudent={onViewStudent}
                  onEditStudent={onEditStudent}
                  onSendReminder={onSendReminder} // FIXED: Pass SMS handler
                  canSendReminder={canSendReminder} // FIXED: Pass SMS eligibility checker
                  smsLoading={smsLoading} // FIXED: Pass SMS loading state
                  getStudentStatus={getStudentStatus}
                  getDaysRemaining={getDaysRemaining}
                />
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-400">
                  {isSearchActive ? (
                    <div>
                      <div className="text-4xl mb-2">🔍</div>
                      <p>No students match your search criteria.</p>
                      <button
                        onClick={handleClearSearch}
                        className="text-blue-400 hover:text-blue-300 mt-2"
                      >
                        Clear search
                      </button>
                    </div>
                  ) : currentTab !== "all" ? (
                    <div>
                      <div className="text-4xl mb-2">📋</div>
                      <p>No students found in the "{tabs.find(t => t.id === currentTab)?.label}" category.</p>
                      <button
                        onClick={() => setCurrentTab("all")}
                        className="text-blue-400 hover:text-blue-300 mt-2"
                      >
                        View all students
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="text-4xl mb-2">👥</div>
                      <p>No students found.</p>
                      <button
                        onClick={() => setAddStudentModalOpen(true)}
                        className="text-blue-400 hover:text-blue-300 mt-2"
                      >
                        Add your first student
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ENHANCED: SMS Reminder Information Panel */}
      {filteredStudents.some(student => canSendReminder(student)) && (
        <div className="px-6 py-4 bg-purple-900 bg-opacity-30 border-t border-purple-700">
          <div className="flex items-center space-x-2 text-sm text-purple-200">
            <span>📱</span>
            <span>
              {filteredStudents.filter(student => canSendReminder(student)).length} student(s) 
              eligible for SMS reminders
            </span>
            <span className="text-purple-400">•</span>
            <span className="text-purple-300">₱0.60 per SMS</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagementSection;