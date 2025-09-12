// File: client/src/components/StudentProfileView.jsx
// Lines 1-20: Enhanced StudentProfileView - Mobile-First with All Existing Functionality Preserved
import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";

/**
 * StudentProfileView Component - MOBILE-FIRST ENHANCED VERSION
 * Optimized for Realme C67 and all mobile devices while preserving ALL existing functionality
 * 
 * ENHANCEMENTS APPLIED:
 * - Mobile-first responsive design (320px to desktop)
 * - Touch-friendly buttons and interactions
 * - Improved card layouts with better spacing
 * - Enhanced visual hierarchy for mobile viewing
 * - All existing API calls and business logic preserved
 * - Real data integration maintained
 * - Error handling and loading states enhanced
 * - Accessibility improvements (WCAG compliant)
 * - Performance optimizations with useMemo
 */

const StudentProfileView = ({ student, onBack, onEdit }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Initialize component with provided student data - PRESERVED
  useEffect(() => {
    if (student) {
      setStudentData(student);
      setLoading(false);
      setError(null);
      // Fetch payment history when student data is loaded
      fetchPaymentHistory(student.id);
    } else {
      setError("Student data not provided");
      setLoading(false);
    }
  }, [student]);

  // Fetch payment history for the student - PRESERVED
  const fetchPaymentHistory = async (studentId) => {
    if (!studentId || !token) return;
    
    setPaymentLoading(true);
    try {
      const response = await fetch(`/api/payments/student/${studentId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch payment history");
      }

      const result = await response.json();
      setPaymentHistory(result.payments || []);
    } catch (error) {
      console.error("Payment history fetch error:", error);
      setPaymentHistory([]);
    } finally {
      setPaymentLoading(false);
    }
  };

  // Enhanced membership status calculation - PRESERVED with improvements
  const membershipStatus = useMemo(() => {
    if (!studentData?.memberships || studentData.memberships.length === 0) {
      return {
        status: "inactive",
        message: "No active membership",
        color: "text-gray-400",
        bgColor: "bg-gray-500",
        icon: "⚫"
      };
    }

    // Find latest membership by creation date or end date
    const latestMembership = studentData.memberships.reduce((latest, current) => {
      const currentDate = new Date(current.createdAt || current.endDate);
      const latestDate = new Date(latest.createdAt || latest.endDate);
      return currentDate > latestDate ? current : latest;
    });

    const today = new Date();
    const endDate = new Date(latestMembership.endDate);
    
    // Clear time for accurate comparison
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 7) {
      return {
        status: "active",
        message: `${diffDays} days remaining`,
        color: "text-green-400",
        bgColor: "bg-green-500",
        icon: "✅"
      };
    } else if (diffDays > 0) {
      return {
        status: "expiring",
        message: `${diffDays} day${diffDays === 1 ? '' : 's'} remaining`,
        color: "text-yellow-400",
        bgColor: "bg-yellow-500",
        icon: "⚠️"
      };
    } else if (diffDays === 0) {
      return {
        status: "expiring",
        message: "Expires today",
        color: "text-orange-400",
        bgColor: "bg-orange-500",
        icon: "🔔"
      };
    } else {
      return {
        status: "overdue",
        message: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'}`,
        color: "text-red-400",
        bgColor: "bg-red-500",
        icon: "🚨"
      };
    }
  }, [studentData]);

  // Safe date formatting function - PRESERVED
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "Invalid Date";
    }
  };

  // Format currency for payment amounts - PRESERVED
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "₱0";
    return `₱${parseFloat(amount).toLocaleString()}`;
  };

  // Enhanced payment status badge styling - IMPROVED
  const getPaymentStatusBadge = (status) => {
    const statusStyles = {
      completed: "bg-green-500 bg-opacity-20 text-green-400 border-green-500",
      pending: "bg-yellow-500 bg-opacity-20 text-yellow-400 border-yellow-500",
      failed: "bg-red-500 bg-opacity-20 text-red-400 border-red-500",
      cancelled: "bg-gray-500 bg-opacity-20 text-gray-400 border-gray-500"
    };
    
    const style = statusStyles[status?.toLowerCase()] || statusStyles.pending;
    const displayStatus = status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown";
    
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full border ${style}`}>
        {displayStatus}
      </span>
    );
  };

  // Enhanced loading state - Mobile-optimized
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading student profile...</p>
        </div>
      </div>
    );
  }

  // Enhanced error state - Mobile-optimized
  if (error || !studentData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-xl border border-gray-600 p-6 max-w-sm w-full text-center shadow-xl">
          <div className="text-red-500 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Profile Unavailable</h3>
          <p className="text-red-400 mb-6 text-sm">{error || "Student data could not be loaded"}</p>
          <button
            onClick={onBack}
            className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 active:bg-red-800 transition-all duration-200 font-medium min-h-[48px] transform active:scale-95"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Main profile view render - ENHANCED MOBILE-FIRST
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Enhanced Mobile-First Header */}
      <div className="bg-gray-800 shadow-xl border-b border-gray-700 sticky top-0 z-10">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 sm:py-6 gap-4">
            <div className="flex-1">
              <button
                onClick={onBack}
                className="flex items-center text-gray-400 hover:text-blue-400 mb-2 transition-colors duration-200 text-sm min-h-[44px]"
              >
                <span className="mr-2">←</span>
                <span>Back to Dashboard</span>
              </button>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white truncate">
                {studentData.name || "Student Profile"}
              </h1>
              {/* Mobile-friendly status badge */}
              <div className="mt-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${membershipStatus.bgColor} bg-opacity-20 ${membershipStatus.color} border border-current`}>
                  <span className="mr-2">{membershipStatus.icon}</span>
                  {membershipStatus.message}
                </span>
              </div>
            </div>
            <button
              onClick={() => onEdit(studentData)}
              className="w-full sm:w-auto bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 active:bg-red-800 transition-all duration-200 font-medium min-h-[48px] transform active:scale-95"
            >
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Mobile-First Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Mobile-First Layout: Stack on mobile, side-by-side on desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Enhanced Basic Information Card */}
            <div className="lg:col-span-1">
              <div className="bg-gray-800 rounded-xl border border-gray-600 shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-6 py-4 border-b border-gray-600">
                  <h3 className="text-lg font-semibold text-white flex items-center">
                    <span className="mr-2">👤</span>
                    Basic Information
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  {/* Enhanced info display with better mobile spacing */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-gray-700">
                      <label className="text-sm font-medium text-gray-400">Name</label>
                      <p className="text-sm font-medium text-white text-right">{studentData.name || "N/A"}</p>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-700">
                      <label className="text-sm font-medium text-gray-400">Email</label>
                      <p className="text-sm text-white text-right truncate max-w-[150px]">{studentData.email || "N/A"}</p>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-700">
                      <label className="text-sm font-medium text-gray-400">Phone</label>
                      <p className="text-sm text-white text-right">{studentData.phone || "N/A"}</p>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-700">
                      <label className="text-sm font-medium text-gray-400">Student ID</label>
                      <p className="text-sm font-mono text-white">#{studentData.id}</p>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <label className="text-sm font-medium text-gray-400">Monthly Rate</label>
                      <p className="text-lg font-bold text-white">₱{(studentData.monthlyRate || 1400).toLocaleString()}/mo</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Current Membership & Payment History */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Enhanced Current Membership Card */}
              <div className="bg-gray-800 rounded-xl border border-gray-600 shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-6 py-4 border-b border-gray-600">
                  <h3 className="text-lg font-semibold text-white flex items-center">
                    <span className="mr-2">🎫</span>
                    Current Membership
                  </h3>
                </div>
                <div className="p-6">
                  {studentData.memberships && studentData.memberships.length > 0 ? (
                    (() => {
                      const latestMembership = studentData.memberships.reduce((latest, current) => {
                        const currentDate = new Date(current.createdAt || current.endDate);
                        const latestDate = new Date(latest.createdAt || latest.endDate);
                        return currentDate > latestDate ? current : latest;
                      });
                      
                      return (
                        <div className="space-y-6">
                          {/* Membership Header - Mobile optimized */}
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-2xl">{membershipStatus.icon}</span>
                                <p className="text-xl font-bold text-white">
                                  {latestMembership.type || "MONTHLY"}
                                </p>
                              </div>
                              <p className={`text-sm font-semibold ${membershipStatus.color}`}>
                                {membershipStatus.message}
                              </p>
                            </div>
                            <div className="text-center sm:text-right">
                              <p className="text-2xl font-bold text-white">
                                ₱{(studentData.monthlyRate || 1400).toLocaleString()}
                              </p>
                              <p className="text-sm text-gray-400">Monthly Fee</p>
                            </div>
                          </div>
                          
                          {/* Membership Dates - Mobile-first grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-750 rounded-lg border border-gray-600">
                            <div className="text-center sm:text-left">
                              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Start Date</label>
                              <p className="text-sm font-medium text-white">{formatDate(latestMembership.startDate)}</p>
                            </div>
                            <div className="text-center sm:text-left">
                              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">End Date</label>
                              <p className="text-sm font-medium text-white">{formatDate(latestMembership.endDate)}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-500 mb-3">
                        <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-gray-400">No membership found</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Enhanced Payment History Card */}
              <div className="bg-gray-800 rounded-xl border border-gray-600 shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-6 py-4 border-b border-gray-600">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white flex items-center">
                      <span className="mr-2">💳</span>
                      Payment History
                    </h3>
                    {paymentLoading && (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                        <span className="text-sm text-gray-400">Loading...</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Enhanced Payment History Display */}
                {!paymentLoading && paymentHistory.length > 0 ? (
                  <>
                    {/* Mobile Card View */}
                    <div className="block lg:hidden divide-y divide-gray-600">
                      {paymentHistory.map((payment, index) => (
                        <div key={payment.id || index} className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-white mb-1">
                                {payment.description || "Payment"}
                              </p>
                              <p className="text-xs text-gray-400">
                                {formatDate(payment.paidAt || payment.createdAt)}
                              </p>
                            </div>
                            <div className="text-right ml-4">
                              <p className="text-lg font-bold text-white">
                                {formatCurrency(payment.amount)}
                              </p>
                              <div className="mt-1">
                                {getPaymentStatusBadge(payment.status)}
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-between items-center text-xs text-gray-400">
                            <span>Method: {payment.method || "N/A"}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden lg:block overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-600">
                        <thead className="bg-gray-700">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Method</th>
                          </tr>
                        </thead>
                        <tbody className="bg-gray-800 divide-y divide-gray-600">
                          {paymentHistory.map((payment, index) => (
                            <tr key={payment.id || index} className="hover:bg-gray-750 transition-colors duration-200">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                {payment.description || "Payment"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-white">
                                {formatCurrency(payment.amount)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                {formatDate(payment.paidAt || payment.createdAt)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {getPaymentStatusBadge(payment.status)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                {payment.method || "N/A"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : !paymentLoading && (
                  <div className="p-8 text-center">
                    <div className="text-gray-500 mb-3">
                      <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-400 mb-4">No payment history found</p>
                    <p className="text-sm text-gray-500">Payment records will appear here once transactions are made.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Safe Area */}
      <div className="h-6 lg:hidden" />
    </div>
  );
};

export default StudentProfileView;