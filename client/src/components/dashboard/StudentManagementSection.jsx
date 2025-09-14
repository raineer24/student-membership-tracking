// File: client/src/components/dashboard/StudentManagementSection.jsx
// Lines 1-20: Enhanced Student Management with Training Session Integration - Desktop & Mobile
import React, { useState } from "react";

/**
 * StudentManagementSection Component - COMPLETE TRAINING SESSION INTEGRATION
 * Features:
 * - Training session button in both mobile cards AND desktop table
 * - Simplified jiu-jitsu modal (no skills, no duration)
 * - Data persistence with immediate refresh
 * - Revenue protection through attendance tracking
 */

// Lines 25-150: Safe Date Utilities (preserved)
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
      
      return getDateValue(b) - getDateValue(a);
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

// Lines 155-350: Mobile Student Card with Training Button
const StudentCard = ({ 
  student, 
  onProcessPayment, 
  onViewStudent, 
  onEditStudent, 
  onSendReminder, 
  canSendReminder, 
  smsLoading,
  students = [],
  onTrainingSessionSuccess
}) => {
  if (!student || typeof student !== 'object') {
    return null;
  }

  const studentName = String(student.name || 'Unknown Student');
  const studentEmail = String(student.email || 'No email');
  const studentPhone = String(student.phone || student.phoneNumber || 'No phone');
  const monthlyRate = parseFloat(student.monthlyRate || student.rate || 1400);
  const isLegacy = student.isLegacyStudent || monthlyRate < 1400;

  const status = getSafeStudentStatus(student);
  const latestMembership = getSafeLatestMembership(student);
  const dueDateInfo = latestMembership?.endDate 
    ? formatSafeDueDate(latestMembership.endDate)
    : { text: "No membership", color: "text-gray-400" };

  const canSendSMS = canSendReminder ? canSendReminder(student) : (
    (status === 'expiring' || status === 'overdue') && 
    Boolean(student.phone || student.phoneNumber)
  );

  const statusConfig = {
    active: { bg: "bg-green-600", text: "text-white", icon: "✅", label: "Active" },
    expiring: { bg: "bg-yellow-600", text: "text-white", icon: "⚠️", label: "Expiring" },
    overdue: { bg: "bg-red-600", text: "text-white", icon: "🚨", label: "Overdue" },
    inactive: { bg: "bg-gray-600", text: "text-white", icon: "⚫", label: "Inactive" }
  };

  const config = statusConfig[status] || statusConfig.inactive;

  return (
    <div className="bg-gray-750 rounded-xl p-5 border border-gray-600 shadow-lg">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {studentName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-base truncate">{studentName}</h3>
            <p className="text-gray-400 text-sm truncate">{studentEmail}</p>
            <p className="text-gray-400 text-sm">{studentPhone}</p>
          </div>
        </div>
        
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

      <div className="space-y-3">
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => onViewStudent && onViewStudent(student.id)}
            className="flex flex-col items-center justify-center py-3 px-1 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-medium rounded-lg transition-all duration-200 min-h-[52px] transform active:scale-95"
          >
            <span className="text-lg mb-1">👁️</span>
            <span>View</span>
          </button>
          
          <button
            onClick={() => onEditStudent && onEditStudent(student)}
            className="flex flex-col items-center justify-center py-3 px-1 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-xs font-medium rounded-lg transition-all duration-200 min-h-[52px] transform active:scale-95"
          >
            <span className="text-lg mb-1">✏️</span>
            <span>Edit</span>
          </button>
          
          <button
            onClick={() => onProcessPayment && onProcessPayment(student)}
            className="flex flex-col items-center justify-center py-3 px-1 bg-yellow-600 hover:bg-yellow-700 active:bg-yellow-800 text-white text-xs font-medium rounded-lg transition-all duration-200 min-h-[52px] transform active:scale-95"
          >
            <span className="text-lg mb-1">💳</span>
            <span>Pay</span>
          </button>

          <TrainingSessionButton
            student={student}
            students={students}
            onSuccess={onTrainingSessionSuccess}
          />
        </div>
        
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

// Lines 355-500: ENHANCED Desktop Table Row with Training Button
const StudentTableRow = ({ 
  student, 
  onProcessPayment, 
  onViewStudent, 
  onEditStudent, 
  onSendReminder, 
  canSendReminder, 
  smsLoading,
  // NEW: Training session props for desktop
  students = [],
  onTrainingSessionSuccess 
}) => {
  if (!student || typeof student !== 'object') {
    return null;
  }

  const studentName = String(student.name || 'Unknown Student');
  const studentEmail = String(student.email || 'No email');
  const studentPhone = String(student.phone || student.phoneNumber || 'No phone');
  const monthlyRate = parseFloat(student.monthlyRate || student.rate || 1400);
  const isLegacy = student.isLegacyStudent || monthlyRate < 1400;

  const status = getSafeStudentStatus(student);
  const latestMembership = getSafeLatestMembership(student);
  const dueDateInfo = latestMembership?.endDate 
    ? formatSafeDueDate(latestMembership.endDate)
    : { text: "No membership", color: "text-gray-400" };

  const canSendSMS = canSendReminder ? canSendReminder(student) : (
    (status === 'expiring' || status === 'overdue') && 
    Boolean(student.phone || student.phoneNumber)
  );

  const statusConfig = {
    active: { bg: "bg-green-600", text: "text-white", icon: "✅", label: "Active" },
    expiring: { bg: "bg-yellow-600", text: "text-white", icon: "⚠️", label: "Expiring" },
    overdue: { bg: "bg-red-600", text: "text-white", icon: "🚨", label: "Overdue" },
    inactive: { bg: "bg-gray-600", text: "text-white", icon: "⚫", label: "Inactive" }
  };

  const config = statusConfig[status] || statusConfig.inactive;

  return (
    <tr className="hover:bg-gray-750 transition-colors duration-200">
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

          {/* NEW: Training Session Button for Desktop */}
          <TrainingSessionButton
            student={student}
            students={students}
            onSuccess={onTrainingSessionSuccess}
            isDesktop={true}
          />
          
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

// Lines 505-700: Main Student Management Section Component
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
  onTrainingSessionSuccess // NEW: Training session success handler
}) => {
  const tabs = [
    { id: "all", label: "All Students", count: tabCounts.all || 0 },
    { id: "active", label: "Active", count: tabCounts.active || 0 },
    { id: "expiring", label: "Expiring Soon", count: tabCounts.expiring || 0 },
    { id: "overdue", label: "Overdue", count: tabCounts.overdue || 0 },
    { id: "inactive", label: "Inactive", count: tabCounts.inactive || 0 },
  ];

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setIsSearchActive(value.trim().length > 0);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setIsSearchActive(false);
  };

  return (
    <div className="bg-gray-800 shadow-xl rounded-xl overflow-hidden border border-gray-700">
      <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-4 sm:px-6 py-4 border-b border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-lg sm:text-xl font-bold text-white">Student Management</h2>
            <p className="text-gray-400 text-sm mt-1">
              Manage student memberships, payments, SMS reminders, and jiu-jitsu training sessions
            </p>
          </div>
          <button
            onClick={() => setAddStudentModalOpen(true)}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-6 py-3 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 min-h-[52px] font-medium transform active:scale-95"
          >
            <span className="text-lg">➕</span>
            <span>Add Student</span>
          </button>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-4 bg-gray-750 border-b border-gray-700 space-y-4">
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
      </div>

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

      {filteredStudents.length > 0 ? (
        <>
          <div className="block lg:hidden">
            <div className="p-4 space-y-4">
              {filteredStudents.map((student) => (
                <StudentCard
                  key={student.id}
                  student={student}
                  students={students}
                  onTrainingSessionSuccess={onTrainingSessionSuccess}
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
                    students={students} // NEW: Pass students for training modal
                    onTrainingSessionSuccess={onTrainingSessionSuccess} // NEW: Training success handler
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
        </div>
      )}

      <div className="h-6 lg:hidden" />
    </div>
  );
};

// Lines 705-750: Training Session Button Component (Works for Both Mobile & Desktop)
const TrainingSessionButton = ({ student, students, onSuccess, isDesktop = false }) => {
  const [showModal, setShowModal] = useState(false);

  if (isDesktop) {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          className="text-orange-400 hover:text-orange-300 p-2 rounded-lg hover:bg-gray-700 transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
          title={`Log jiu-jitsu training for ${student.name}`}
        >
          <span className="text-lg">🥋</span>
        </button>

        <JiuJitsuTrainingModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          students={students}
          selectedStudent={student}
          onSuccess={(message) => {
            setShowModal(false);
            onSuccess && onSuccess(message);
          }}
        />
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex flex-col items-center justify-center py-3 px-1 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white text-xs font-medium rounded-lg transition-all duration-200 min-h-[52px] transform active:scale-95"
        title={`Log jiu-jitsu training for ${student.name}`}
      >
        <span className="text-lg mb-1">🥋</span>
        <span>Log Training</span>
      </button>

      <JiuJitsuTrainingModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        students={students}
        selectedStudent={student}
        onSuccess={(message) => {
          setShowModal(false);
          onSuccess && onSuccess(message);
        }}
      />
    </>
  );
};

// Lines 755-950: SIMPLIFIED Jiu-Jitsu Training Modal (No Skills, No Duration)
const JiuJitsuTrainingModal = ({ 
  isOpen, 
  onClose, 
  students = [], 
  onSuccess,
  selectedStudent = null 
}) => {
  const [formData, setFormData] = useState({
    studentId: selectedStudent?.id || '',
    sessionType: 'WEEKEND',
    sessionDate: '',
    attendanceStatus: 'PRESENT',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        studentId: selectedStudent?.id || '',
        sessionType: 'WEEKEND',
        sessionDate: new Date().toISOString().split('T')[0],
        attendanceStatus: 'PRESENT',
        notes: ''
      });
      setError('');
    }
  }, [isOpen, selectedStudent]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (!formData.studentId || !formData.sessionDate) {
        throw new Error('Student and session date are required');
      }

      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/training-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: parseInt(formData.studentId),
          sessionType: formData.sessionType,
          sessionDate: formData.sessionDate,
          attendanceStatus: formData.attendanceStatus,
          notes: formData.notes
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to log training session');
      }

      console.log('✅ Training session logged:', result.data);
      const studentName = result.data?.student?.name || 
                          students.find(s => s.id === parseInt(formData.studentId))?.name || 
                          'Student';
      
      onSuccess && onSuccess(`Training session logged for ${studentName}`);
      onClose();

      // Force refresh dashboard data immediately
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (err) {
      console.error('❌ Failed to log training session:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-700">
        
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <span className="mr-2">🥋</span>
            Log Jiu-Jitsu Training
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2"
            disabled={isSubmitting}
          >
            <span className="text-xl">✕</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {error && (
            <div className="bg-red-600 bg-opacity-20 border border-red-600 rounded-lg p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Student <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.studentId}
              onChange={(e) => handleInputChange('studentId', e.target.value)}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={selectedStudent || isSubmitting}
            >
              <option value="">Select a student...</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.name} - {student.email}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Session Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={formData.sessionDate}
                onChange={(e) => handleInputChange('sessionDate', e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Session Type
              </label>
              <select
                value={formData.sessionType}
                onChange={(e) => handleInputChange('sessionType', e.target.value)}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                <option value="WEEKEND">Weekend (Primary)</option>
                <option value="WEEKDAY">Weekday (MWF)</option>
                <option value="TRIAL">Trial Session</option>
                <option value="MAKEUP">Makeup Session</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Attendance Status
            </label>
            <select
              value={formData.attendanceStatus}
              onChange={(e) => handleInputChange('attendanceStatus', e.target.value)}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              <option value="PRESENT">Present</option>
              <option value="LATE">Late</option>
              <option value="LEFT_EARLY">Left Early</option>
              <option value="ABSENT">Absent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Session Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows="3"
              placeholder="Optional notes about the session, student progress, techniques practiced, etc..."
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-3 text-gray-300 hover:text-white transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Logging...</span>
                </>
              ) : (
                <>
                  <span>🥋</span>
                  <span>Log Session</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentManagementSection;