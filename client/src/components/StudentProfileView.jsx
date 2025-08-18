// File: client/src/components/StudentProfileView.jsx
// Complete StudentProfileView component - no routing required
import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";

const StudentProfileView = ({ student, onBack, onEdit }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Initialize component with provided student data
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

  // Fetch payment history for the student
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

  // Enhanced membership status calculation
  const membershipStatus = useMemo(() => {
    if (!studentData?.memberships || studentData.memberships.length === 0) {
      return {
        status: "inactive",
        message: "No active membership",
        color: "text-gray-400"
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

    if (diffDays > 0) {
      return {
        status: "active",
        message: `${diffDays} days remaining`,
        color: "text-green-400"
      };
    } else if (diffDays === 0) {
      return {
        status: "expiring",
        message: "Expires today",
        color: "text-yellow-400"
      };
    } else {
      return {
        status: "overdue",
        message: `Overdue by ${Math.abs(diffDays)} days`,
        color: "text-red-400"
      };
    }
  }, [studentData]);

  // Safe date formatting function
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "Invalid Date";
    }
  };

  // Format currency for payment amounts
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "₱0";
    return `₱${parseFloat(amount).toLocaleString()}`;
  };

  // Get payment status badge styling
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
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${style}`}>
        {displayStatus}
      </span>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading student profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !studentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-xl border border-gray-600 p-8 max-w-md text-center">
          <div className="text-red-500 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Profile Unavailable</h3>
          <p className="text-red-400 mb-4">{error || "Student data could not be loaded"}</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Main profile view render
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <div className="bg-gray-800 bg-opacity-90 backdrop-blur-sm shadow-xl border-b border-gray-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <button
                onClick={onBack}
                className="flex items-center text-gray-400 hover:text-red-500 mb-2 transition-colors"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-3xl font-bold text-white">
                {studentData.name || "Student Profile"}
              </h1>
            </div>
            <button
              onClick={() => onEdit(studentData)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Basic Information Card */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 bg-opacity-90 backdrop-blur-sm overflow-hidden shadow-xl rounded-xl border border-gray-600">
              <div className="px-6 py-4 border-b border-gray-600">
                <h3 className="text-lg font-medium text-white">Basic Information</h3>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-400">Name</label>
                  <p className="text-sm text-white">{studentData.name || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Email</label>
                  <p className="text-sm text-white">{studentData.email || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Phone</label>
                  <p className="text-sm text-white">{studentData.phone || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Student ID</label>
                  <p className="text-sm text-white">#{studentData.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Monthly Rate</label>
                  <p className="text-sm text-white">₱{studentData.monthlyRate || 1400}/month</p>
                </div>
              </div>
            </div>
          </div>

          {/* Current Membership & History */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Current Membership Card */}
            <div className="bg-gray-800 bg-opacity-90 backdrop-blur-sm overflow-hidden shadow-xl rounded-xl border border-gray-600">
              <div className="px-6 py-4 border-b border-gray-600">
                <h3 className="text-lg font-medium text-white">Current Membership</h3>
              </div>
              <div className="px-6 py-4">
                {studentData.memberships && studentData.memberships.length > 0 ? (
                  (() => {
                    const latestMembership = studentData.memberships.reduce((latest, current) => {
                      const currentDate = new Date(current.createdAt || current.endDate);
                      const latestDate = new Date(latest.createdAt || latest.endDate);
                      return currentDate > latestDate ? current : latest;
                    });
                    
                    return (
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-lg font-semibold text-white">
                              {latestMembership.type || "MONTHLY"}
                            </p>
                            <p className={`text-sm font-medium ${membershipStatus.color}`}>
                              {membershipStatus.message}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-white">
                              ₱{studentData.monthlyRate || 1400}
                            </p>
                            <p className="text-sm text-gray-400">Monthly Fee</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-600">
                          <div>
                            <label className="text-sm font-medium text-gray-400">Start Date</label>
                            <p className="text-sm text-white">{formatDate(latestMembership.startDate)}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-400">End Date</label>
                            <p className="text-sm text-white">{formatDate(latestMembership.endDate)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <p className="text-gray-400">No membership found</p>
                )}
              </div>
            </div>

            {/* Payment History Card */}
            <div className="bg-gray-800 bg-opacity-90 backdrop-blur-sm overflow-hidden shadow-xl rounded-xl border border-gray-600">
              <div className="px-6 py-4 border-b border-gray-600">
                <h3 className="text-lg font-medium text-white">Payment History</h3>
                {paymentLoading && (
                  <div className="flex items-center mt-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500 mr-2"></div>
                    <span className="text-sm text-gray-400">Loading payments...</span>
                  </div>
                )}
              </div>
              <div className="overflow-x-auto">
                {!paymentLoading && paymentHistory.length > 0 ? (
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
                        <tr key={payment.id || index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                            {payment.description || "Payment"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
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
                ) : !paymentLoading && (
                  <div className="px-6 py-8 text-center">
                    <div className="text-gray-500 mb-2">
                      <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-400">No payment history found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfileView;