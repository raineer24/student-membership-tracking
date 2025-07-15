// Line 1: Complete StudentProfileView.jsx - Student profile viewing component
// Clean implementation for viewing student details and memberships
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

// Line 8: StudentProfileView Component - displays detailed student information
const StudentProfileView = ({ student, onBack, onEdit }) => {
  const { token } = useAuth();
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Line 15: Fetch detailed student data when component mounts
  useEffect(() => {
    if (student?.id) {
      fetchStudentDetails(student.id);
    } else if (student) {
      // If full student object is passed, use it directly
      setStudentData(student);
      setLoading(false);
    }
  }, [student]);

  // Line 25: Fetch student details from API
  const fetchStudentDetails = async (studentId) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/students/${studentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch student details: ${response.status}`);
      }

      const data = await response.json();
      setStudentData(data);
    } catch (error) {
      console.error('Error fetching student details:', error);
      setError('Failed to load student details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Line 47: Helper function to determine student status
  const getStudentStatus = (student) => {
    if (!student.memberships || student.memberships.length === 0) {
      return { status: 'INACTIVE', color: 'gray', bgColor: 'bg-gray-100' };
    }
    
    const now = new Date();
    const activeMembership = student.memberships.find(membership => {
      const endDate = new Date(membership.endDate);
      return endDate > now;
    });
    
    if (activeMembership) {
      return { status: 'ACTIVE', color: 'green', bgColor: 'bg-green-100' };
    }
    
    // Check if recently expired (within 30 days) = OVERDUE
    const recentlyExpired = student.memberships.some(membership => {
      const endDate = new Date(membership.endDate);
      const daysSinceExpiry = (now - endDate) / (1000 * 60 * 60 * 24);
      return daysSinceExpiry > 0 && daysSinceExpiry <= 30;
    });
    
    if (recentlyExpired) {
      return { status: 'OVERDUE', color: 'red', bgColor: 'bg-red-100' };
    }
    
    return { status: 'EXPIRED', color: 'red', bgColor: 'bg-red-100' };
  };

  // Line 73: Helper function to get latest membership
  const getLatestMembership = (memberships) => {
    if (!memberships || memberships.length === 0) return null;
    return memberships.reduce((latest, current) => {
      return new Date(current.endDate) > new Date(latest.endDate) ? current : latest;
    });
  };

  // Line 80: Helper function to format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Line 88: Helper function to format dates
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Line 100: Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner message="Loading student profile..." />
      </div>
    );
  }

  // Line 108: Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <ErrorMessage 
          message={error} 
          onRetry={() => fetchStudentDetails(student?.id)}
        />
      </div>
    );
  }

  // Line 118: No student data state
  if (!studentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Student Not Found</h2>
          <p className="text-gray-600 mb-4">The requested student profile could not be loaded.</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Line 134: Calculate derived data
  const statusInfo = getStudentStatus(studentData);
  const latestMembership = getLatestMembership(studentData.memberships);
  const studentName = studentData.name || 
    `${studentData.firstName || ''} ${studentData.lastName || ''}`.trim() || 
    'Unknown Student';

  // Line 141: Main render
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <button
                onClick={onBack}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                title="Back to dashboard"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Student Profile</h1>
                <p className="text-gray-600">{studentName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onEdit(studentData)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                ✏️ Edit Profile
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Basic Information Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                statusInfo.bgColor
              } text-${statusInfo.color}-800`}>
                {statusInfo.status}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Full Name</label>
                <p className="text-lg text-gray-900">{studentName}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Email Address</label>
                <p className="text-lg text-gray-900">{studentData.email || 'N/A'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Phone Number</label>
                <p className="text-lg text-gray-900">{studentData.phone || 'N/A'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Student ID</label>
                <p className="text-lg text-gray-900">#{studentData.id}</p>
              </div>
            </div>
          </div>

          {/* Current Membership Card */}
          {latestMembership ? (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Membership</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Type</label>
                  <p className="text-lg text-gray-900">
                    {latestMembership.type || latestMembership.membershipType || 'N/A'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Fee</label>
                  <p className="text-lg text-gray-900">
                    {formatCurrency(latestMembership.fee || latestMembership.amount)}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Start Date</label>
                  <p className="text-lg text-gray-900">
                    {formatDate(latestMembership.startDate)}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">End Date</label>
                  <p className="text-lg text-gray-900">
                    {formatDate(latestMembership.endDate)}
                  </p>
                </div>
              </div>
              
              {/* Membership Status Alert */}
              {statusInfo.status === 'OVERDUE' && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="text-red-500 mr-3 mt-0.5">
                      ⚠️
                    </div>
                    <div>
                      <p className="text-red-800 font-medium text-sm">Membership Overdue</p>
                      <p className="text-red-700 text-sm mt-1">
                        This student's membership has expired and requires renewal.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Membership Status</h2>
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-lg font-medium text-gray-900">No Active Membership</p>
                <p className="text-gray-500 mt-2">This student does not have any membership records.</p>
              </div>
            </div>
          )}

          {/* Membership History */}
          {studentData.memberships && studentData.memberships.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Membership History</h2>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Period
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {studentData.memberships
                      .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
                      .map((membership, index) => {
                        const membershipStatus = new Date(membership.endDate) > new Date() ? 'Active' : 'Expired';
                        const isActive = membershipStatus === 'Active';
                        
                        return (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {membership.type || membership.membershipType || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(membership.startDate)} - {formatDate(membership.endDate)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(membership.fee || membership.amount)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                isActive 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {membershipStatus}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Payment History */}
          {studentData.payments && studentData.payments.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h2>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {studentData.payments
                      .sort((a, b) => new Date(b.paidAt || b.createdAt) - new Date(a.paidAt || a.createdAt))
                      .map((payment, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(payment.paidAt || payment.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(payment.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {payment.method || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              {payment.status || 'Completed'}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentProfileView;