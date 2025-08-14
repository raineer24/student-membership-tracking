// client/src/components/DashboardPage.jsx
// Lines 1-25: Imports and dependencies (Updated with new components)
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { adminApi } from '../services/adminApi';
import { isOverdue } from '../utils/dateUtils';
import { getStudentPricingDisplay, getPricingTier } from '../utils/studentPricingUtils';

// Component imports (Phase 3 additions)
import LogoutButton from './LogoutButton';
import StudentsTable from './student/StudentsTable';
import SMSCreditsModal from './modals/SMSCreditsModal';
import SMSHistoryModal from './modals/SMSHistoryModal';

// Existing component imports
import StudentProfileView from './StudentProfileView';
import StudentEditForm from './StudentEditForm';
import PaymentModal from './PaymentModal';
import AddStudentModal from './AddStudentModal';

// Lines 26-380: Main DashboardPage component
export default function DashboardPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // View state management
  const [activeView, setActiveView] = useState("dashboard");
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [studentToEdit, setStudentToEdit] = useState(null);

  const { showSuccess, showError } = useToast();

  // Modal states
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [addStudentModalOpen, setAddStudentModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Student filtering and search state
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Lines 45-95: Data fetching and refresh logic
  const fetchDashboardData = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      const [dashboard, studentsData] = await Promise.all([
        adminApi.getDashboardData(),
        adminApi.getAllStudents()
      ]);

      setDashboardData(dashboard);
      setStudents(studentsData);

    } catch (error) {
      console.error("Dashboard fetch error:", error);
      setError("Failed to load dashboard data. Please try again.");
      
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const refreshData = useCallback(async () => {
    await fetchDashboardData();
    showSuccess("Data refreshed successfully!");
  }, [fetchDashboardData, showSuccess]);

  // Lines 96-145: Student filtering and counting logic
  const getFilteredStudents = useCallback(() => {
    if (!students || !Array.isArray(students)) return [];

    let filtered = students;

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(student => 
        student.name?.toLowerCase().includes(search) ||
        student.email?.toLowerCase().includes(search) ||
        student.phone?.includes(search) ||
        student.id?.toString().includes(search)
      );
    }

    // Apply status filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(student => {
        const latestMembership = student.memberships && student.memberships.length > 0 
          ? student.memberships.reduce((latest, current) => 
              new Date(current.startDate) > new Date(latest.startDate) ? current : latest
            ) 
          : null;

        switch (selectedFilter) {
          case 'active':
            return latestMembership && !isOverdue(latestMembership.endDate);
          case 'overdue':
            return latestMembership && isOverdue(latestMembership.endDate);
          case 'inactive':
            return !latestMembership;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [students, searchTerm, selectedFilter]);

  const filteredStudents = getFilteredStudents();

  // Lines 146-170: Calculate tab counts and pricing breakdown
  const calculateTabCounts = useCallback(() => {
    if (!students || !Array.isArray(students)) {
      return { all: 0, active: 0, overdue: 0, inactive: 0 };
    }

    const counts = { all: students.length, active: 0, overdue: 0, inactive: 0 };

    students.forEach(student => {
      const latestMembership = student.memberships && student.memberships.length > 0 
        ? student.memberships.reduce((latest, current) => 
            new Date(current.startDate) > new Date(latest.startDate) ? current : latest
          ) 
        : null;

      if (!latestMembership) {
        counts.inactive++;
      } else if (isOverdue(latestMembership.endDate)) {
        counts.overdue++;
      } else {
        counts.active++;
      }
    });

    return counts;
  }, [students]);

  const tabCounts = calculateTabCounts();

  // Lines 171-220: Calculate pricing breakdown
  const calculatePricingBreakdown = useCallback(() => {
    if (!students || !Array.isArray(students)) {
      return {
        discounted: 0, standard: 0, legacy: 0, total: 0,
        totalMonthlyRevenuePotential: 0, totalYearlyRevenuePotential: 0
      };
    }

    const breakdown = {
      discounted: 0, standard: 0, legacy: 0, total: students.length,
      totalMonthlyRevenuePotential: 0, totalYearlyRevenuePotential: 0
    };

    students.forEach(student => {
      const tier = getPricingTier(student);
      breakdown[tier]++;

      // Calculate revenue potential
      const pricing = getStudentPricingDisplay(student);
      if (pricing.monthlyRate) {
        breakdown.totalMonthlyRevenuePotential += pricing.monthlyRate;
      }
    });

    breakdown.totalYearlyRevenuePotential = breakdown.totalMonthlyRevenuePotential * 12;

    return breakdown;
  }, [students]);

  const pricingBreakdown = calculatePricingBreakdown();

  // Lines 221-280: Event handlers for student actions
  const handleViewStudent = useCallback((studentId) => {
    setSelectedStudentId(studentId);
    setActiveView("profile");
  }, []);

  const handleEditStudent = useCallback((student) => {
    setStudentToEdit(student);
    setActiveView("edit");
  }, []);

  const handleProcessPayment = useCallback((student) => {
    setSelectedStudent(student);
    setPaymentModalOpen(true);
  }, []);

  const handleSendReminder = useCallback(async (student) => {
    try {
      const response = await adminApi.sendSMSReminder({
        studentId: student.id,
        testMode: process.env.NODE_ENV === "development",
      });

      if (response.data.success) {
        showSuccess(`SMS reminder sent to ${student.name}!`);
      } else {
        throw new Error(response.data.error || "Failed to send SMS");
      }
    } catch (error) {
      console.error("SMS reminder error:", error);
      showError(`Failed to send SMS: ${error.message}`);
    }
  }, [showSuccess, showError]);

  const handleSaveStudent = useCallback(async (updatedStudent) => {
    try {
      const savedStudent = await adminApi.updateStudent(updatedStudent.id, updatedStudent);
      
      setStudents(students => 
        students.map(s => s.id === savedStudent.id ? { ...s, ...savedStudent } : s)
      );

      setActiveView("dashboard");
      setSelectedStudentId(null);
      setStudentToEdit(null);
      
      showSuccess(`${String(updatedStudent.name)} updated successfully!`);
      
    } catch (error) {
      console.error("handleSaveStudent: Error occurred", error);
      showError(`Failed to update student: ${String(error.message)}`);
      throw error;
    }
  }, [showSuccess, showError, setStudents]);

  const handleBackToDashboard = useCallback(() => {
    setActiveView("dashboard");
    setSelectedStudentId(null);
    setStudentToEdit(null);
  }, []);

  // Lines 281-320: Loading and error states
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading dashboard...</p>
          <p className="text-gray-400 text-sm mt-2">Using enhanced auth interceptors...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-xl border border-gray-600 p-8 max-w-md text-center">
          <div className="text-red-500 mb-4">
            <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={refreshData}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Lines 321-380: Conditional view rendering
  if (activeView === "profile" && selectedStudentId) {
    return (
      <StudentProfileView
        studentId={selectedStudentId}
        onBack={handleBackToDashboard}
        onEdit={handleEditStudent}
      />
    );
  }

  if (activeView === "edit" && studentToEdit) {
    return (
      <StudentEditForm
        student={studentToEdit}
        onSave={handleSaveStudent}
        onCancel={handleBackToDashboard}
      />
    );
  }

  // Lines 381-750: Main dashboard render
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Student Membership Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Welcome back, {user?.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={refreshData}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh Data
              </button>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          {/* Total Students Card */}
          <div className="bg-gray-800 bg-opacity-90 backdrop-blur-sm overflow-hidden shadow-xl rounded-xl border border-gray-600">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-3xl">👥</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">Total Students</dt>
                    <dd className="text-3xl font-bold text-white">
                      {students?.length || dashboardData?.summary?.totalStudents || 0}
                    </dd>
                    <dd className="text-sm text-gray-500">All registered students</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Active Students Card */}
          <div className="bg-gray-800 bg-opacity-90 backdrop-blur-sm overflow-hidden shadow-xl rounded-xl border border-gray-600">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-3xl">✅</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">Active</dt>
                    <dd className="text-3xl font-bold text-green-400">{tabCounts.active || 0}</dd>
                    <dd className="text-sm text-gray-500">Currently enrolled</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Overdue Students Card */}
          <div className="bg-gray-800 bg-opacity-90 backdrop-blur-sm overflow-hidden shadow-xl rounded-xl border border-gray-600">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-3xl">⚠️</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">Overdue</dt>
                    <dd className="text-3xl font-bold text-red-400">{tabCounts.overdue || 0}</dd>
                    <dd className="text-sm text-gray-500">Payment overdue</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Inactive Students Card */}
          <div className="bg-gray-800 bg-opacity-90 backdrop-blur-sm overflow-hidden shadow-xl rounded-xl border border-gray-600">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-3xl">⏸️</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">Inactive</dt>
                    <dd className="text-3xl font-bold text-gray-400">{tabCounts.inactive || 0}</dd>
                    <dd className="text-sm text-gray-500">No membership</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Card */}
          <div className="bg-gray-800 bg-opacity-90 backdrop-blur-sm overflow-hidden shadow-xl rounded-xl border border-gray-600">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-3xl">💰</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">Monthly Revenue</dt>
                    <dd className="text-2xl font-bold text-green-400">
                      ₱{pricingBreakdown.totalMonthlyRevenuePotential?.toLocaleString() || 0}
                    </dd>
                    <dd className="text-sm text-gray-500">Potential income</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Distribution Section */}
        {pricingBreakdown.total > 0 && (
          <div className="bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-xl border border-gray-600 p-6 mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <span className="mr-2">📊</span>
              Pricing Distribution & Revenue Analysis
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {/* Discounted Members */}
              {pricingBreakdown.discounted > 0 && (
                <div className="text-center p-4 bg-blue-500 bg-opacity-10 rounded-lg border border-blue-500 border-opacity-30">
                  <div className="text-3xl font-bold text-blue-400">{pricingBreakdown.discounted}</div>
                  <div className="text-sm text-blue-300 font-medium">💝 Discounted</div>
                  <div className="text-xs text-gray-400 mt-1">₱1,200/month</div>
                  <div className="text-xs text-blue-400 mt-1">
                    ₱{(pricingBreakdown.discounted * 1200).toLocaleString()}/mo revenue
                  </div>
                </div>
              )}
              
              {/* Legacy Members */}
              {pricingBreakdown.legacy > 0 && (
                <div className="text-center p-4 bg-yellow-500 bg-opacity-10 rounded-lg border border-yellow-500 border-opacity-30">
                  <div className="text-3xl font-bold text-yellow-400">{pricingBreakdown.legacy}</div>
                  <div className="text-sm text-yellow-300 font-medium">🌟 Legacy</div>
                  <div className="text-xs text-gray-400 mt-1">Various rates</div>
                  <div className="text-xs text-yellow-400 mt-1">Legacy pricing</div>
                </div>
              )}
              
              {/* Standard Members */}
              <div className="text-center p-4 bg-green-500 bg-opacity-10 rounded-lg border border-green-500 border-opacity-30">
                <div className="text-3xl font-bold text-green-400">{pricingBreakdown.standard}</div>
                <div className="text-sm text-green-300 font-medium">Standard Members</div>
                <div className="text-xs text-gray-400 mt-1">₱1,400/month</div>
                <div className="text-xs text-green-400 mt-1">
                  ₱{(pricingBreakdown.standard * 1400).toLocaleString()}/mo revenue
                </div>
              </div>
            </div>
            
            {/* Revenue Potential Summary */}
            <div className="mt-6 p-4 bg-gray-700 bg-opacity-50 rounded-lg">
              <h4 className="text-sm font-medium text-white mb-3">💡 Revenue Analysis</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-400">
                    ₱{pricingBreakdown.totalMonthlyRevenuePotential?.toLocaleString() || 0}
                  </div>
                  <div className="text-xs text-gray-400">Monthly Potential</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-400">
                    ₱{pricingBreakdown.totalYearlyRevenuePotential?.toLocaleString() || 0}
                  </div>
                  <div className="text-xs text-gray-400">Yearly Potential</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-400">
                    {pricingBreakdown.total}
                  </div>
                  <div className="text-xs text-gray-400">Total Students</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Student Management Section */}
        <div className="mt-8 bg-white rounded-lg shadow">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              {[
                { key: 'all', name: 'All Students', count: tabCounts.all },
                { key: 'active', name: 'Active', count: tabCounts.active },
                { key: 'overdue', name: 'Overdue', count: tabCounts.overdue },
                { key: 'inactive', name: 'Inactive', count: tabCounts.inactive }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                    ${activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {tab.name}
                  <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* Search and Filters */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search students by name, email, phone, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="sm:w-48">
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="overdue">Overdue Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
            </div>
            
            {/* Results count */}
            <div className="mt-3 text-sm text-gray-600">
              Showing {filteredStudents.length} of {students.length} students
              {searchTerm && ` matching "${searchTerm}"`}
            </div>
          </div>

          {/* Students Table */}
          <StudentsTable
            students={filteredStudents}
            loading={loading}
            onProcessPayment={handleProcessPayment}
            onViewStudent={handleViewStudent}
            onEditStudent={handleEditStudent}
            onSendReminder={handleSendReminder}
          />

          {/* Action Buttons */}
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex gap-3">
              <button
                onClick={() => setAddStudentModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                👤 Add Student
              </button>
              <button
                onClick={() => setPaymentModalOpen(true)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                💳 Process Payment
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <SMSCreditsModal />
      <SMSHistoryModal />

      {paymentModalOpen && (
        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false);
            setSelectedStudent(null);
          }}
          student={selectedStudent}
          onPaymentProcessed={() => {
            refreshData();
            setPaymentModalOpen(false);
            setSelectedStudent(null);
            showSuccess("Payment processed successfully!");
          }}
        />
      )}

      {addStudentModalOpen && (
        <AddStudentModal
          isOpen={addStudentModalOpen}
          onClose={() => setAddStudentModalOpen(false)}
          onStudentAdded={() => {
            refreshData();
            setAddStudentModalOpen(false);
            showSuccess("Student added successfully!");
          }}
        />
      )}
    </div>
  );
}