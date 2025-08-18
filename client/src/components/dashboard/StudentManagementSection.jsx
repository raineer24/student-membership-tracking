// File: client/src/components/dashboard/StudentManagementSection.jsx
// CRITICAL FIX: Use hook's logic instead of component's own calculations
import React from 'react';

const StudentManagementSection = ({
  filteredStudents = [],
  students = [],
  tabCounts = {},
  currentTab = "all",
  searchQuery = "",
  isSearchActive = false,
  setCurrentTab = () => {},
  setSearchQuery = () => {},
  setIsSearchActive = () => {},
  setAddStudentModalOpen = () => {},
  onProcessPayment = () => {},
  onViewStudent = () => {},
  onEditStudent = () => {},
  onSendReminder = () => {},
  canSendReminder = () => false,
  getStudentStatus = () => "active", // FIXED: Use hook's status function
  getDaysRemaining = () => "No data", // FIXED: Use hook's days remaining function
  smsLoading = false
}) => {
  // FIXED: Remove component's own calculation - use hook's logic instead
  const handleSearchInput = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  // Tab configuration
  const tabs = [
    { key: "all", label: "All Students", icon: "👥", count: tabCounts.all || 0 },
    { key: "active", label: "Active", icon: "✅", count: tabCounts.active || 0 },
    { key: "overdue", label: "Overdue", icon: "⚠️", count: tabCounts.overdue || 0 },
    { key: "inactive", label: "Inactive", icon: "⭕", count: tabCounts.inactive || 0 }
  ];

  return (
    <div className="bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-xl border border-gray-600 shadow-xl">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-600">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">Students Management</h3>
          
          <div className="flex items-center space-x-4">
            {/* Search input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search students by name"
                value={searchQuery}
                onChange={handleSearchInput}
                className="w-80 px-4 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {searchQuery && (
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
          </div>
        </div>
        
        {/* Tab navigation */}
        <div className="flex space-x-1">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setCurrentTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-colors ${
                currentTab === tab.key
                  ? "bg-red-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              <span className="bg-gray-600 text-xs px-2 py-1 rounded-full">
                ({tab.count})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Student table */}
      <div className="overflow-x-auto">
        {filteredStudents.length > 0 ? (
          <table className="min-w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                  Student & Pricing
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                  Status & Tier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                  Membership & Next Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                  Due Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-600">
              {filteredStudents.map((student) => {
                // FIXED: Use hook's functions instead of component's own calculations
                const status = getStudentStatus(student);
                const daysRemaining = getDaysRemaining(student);
                
                const statusColors = {
                  active: "bg-green-500",
                  expiring: "bg-yellow-500", 
                  overdue: "bg-red-500",
                  inactive: "bg-gray-500"
                };

                return (
                  <tr key={student.id} className="hover:bg-gray-750">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-white">{student.name}</div>
                        <div className="text-sm text-gray-400">{student.email}</div>
                        <div className="text-sm text-gray-500">{student.phone || student.phoneNumber}</div>
                        <div className="text-sm text-yellow-400">₱{student.monthlyRate || 1400}/mo</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-1">
                        <span className={`inline-flex items-center w-16 h-6 rounded-full ${statusColors[status]} text-white text-xs font-medium justify-center`}>
                          {status.toUpperCase()}
                        </span>
                        <div className="text-xs text-gray-400">
                          {student.monthlyRate === 1000 ? "FOUNDING" : 
                           student.monthlyRate === 1200 ? "EARLY" : 
                           "STANDARD"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm text-white">MONTHLY</div>
                        <div className="text-xs text-gray-400">
                          Started: {student.memberships?.[0]?.startDate ? 
                            new Date(student.memberships[0].startDate).toLocaleDateString() : 
                            "N/A"}
                        </div>
                        <div className="text-xs text-yellow-400">
                          Next: ₱{student.monthlyRate || 1400} | ₱{(student.monthlyRate || 1400) * 12}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {/* FIXED: Use hook's getDaysRemaining function instead of component calculation */}
                      <div className="text-sm text-green-400">{daysRemaining}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => onProcessPayment(student)}
                          className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                        >
                          💳 Pay
                        </button>
                        <button
                          onClick={() => onViewStudent(student.id)}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                        >
                          👁️ View
                        </button>
                        <button
                          onClick={() => onEditStudent(student)}
                          className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                        >
                          🔧 Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">
              {searchQuery ? "No students found" : "No students yet"}
            </div>
            <p className="text-gray-500">
              {searchQuery 
                ? `No students match "${searchQuery}"`
                : "Add your first student to get started"
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentManagementSection;