// Line 1: Fixed StudentProfileView.jsx - Resolves infinite loading issues
// Implements proper loading states and error handling

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";

// Line 6: Main StudentProfileView component with enhanced loading management
const StudentProfileView = ({ student, onBack, onEdit }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [studentData, setStudentData] = useState(null);

  // Line 13: Initialize component with provided student data
  useEffect(() => {
    if (student) {
      setStudentData(student);
      setLoading(false);
      setError(null);
    } else {
      setError("Student data not provided");
      setLoading(false);
    }
  }, [student]);

  // Line 24: Enhanced membership status calculation
  const membershipStatus = useMemo(() => {
    if (!studentData?.memberships || studentData.memberships.length === 0) {
      return {
        status: "inactive",
        message: "No active membership",
        color: "text-gray-600"
      };
    }

    // Line 33: Find current membership
    const latestMembership = studentData.memberships.reduce((latest, current) => {
      const currentEndDate = new Date(current.endDate);
      const latestEndDate = new Date(latest.endDate);
      return currentEndDate > latestEndDate ? current : latest;
    });

    const today = new Date();
    const endDate = new Date(latestMembership.endDate);
    
    // Line 42: Clear date comparison
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    if (endDate >= today) {
      return {
        status: "active",
        message: "Membership Active",
        color: "text-green-600"
      };
    }

    // Line 53: Calculate overdue status
    const timeDiff = today.getTime() - endDate.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

    if (daysDiff <= 30) {
      return {
        status: "overdue",
        message: `Overdue by ${daysDiff} day(s)`,
        color: "text-red-600"
      };
    }

    return {
      status: "inactive",
      message: `Expired ${daysDiff} days ago`,
      color: "text-gray-600"
    };
  }, [studentData]);

  // Line 70: Safe date formatting function
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "Invalid Date";
    }
  };

  // Line 80: Loading state - should be minimal since data is passed as prop
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading student profile...</p>
        </div>
      </div>
    );
  }

  // Line 91: Error state
  if (error || !studentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white rounded-lg shadow p-6 max-w-md">
            <div className="text-red-500 mb-4">
              <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile Unavailable</h3>
            <p className="text-red-600 mb-4">{error || "Student data could not be loaded"}</p>
            <button
              onClick={onBack}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Line 118: Main profile view render
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <button
                onClick={onBack}
                className="flex items-center text-gray-600 hover:text-gray-900 mb-2"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-3xl font-bold text-gray-900">
                {studentData.name || "Student Profile"}
              </h1>
            </div>
            <button
              onClick={() => onEdit(studentData)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Basic Information */}
          <div className="lg:col-span-1">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="text-sm text-gray-900">{studentData.name || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-sm text-gray-900">{studentData.email || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-sm text-gray-900">{studentData.phone || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Student ID</label>
                  <p className="text-sm text-gray-900">#{studentData.id}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Current Membership & History */}
          <div className="lg:col-span-2">
            
            {/* Current Membership */}
            <div className="bg-white overflow-hidden shadow rounded-lg mb-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Current Membership</h3>
              </div>
              <div className="px-6 py-4">
                {studentData.memberships && studentData.memberships.length > 0 ? (
                  (() => {
                    const latestMembership = studentData.memberships.reduce((latest, current) => {
                      const currentEndDate = new Date(current.endDate);
                      const latestEndDate = new Date(latest.endDate);
                      return currentEndDate > latestEndDate ? current : latest;
                    });
                    
                    return (
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-lg font-semibold text-gray-900">
                              {latestMembership.type || latestMembership.membershipType}
                            </p>
                            <p className={`text-sm font-medium ${membershipStatus.color}`}>
                              {membershipStatus.message}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900">
                              ₱{latestMembership.fee || 0}
                            </p>
                            <p className="text-sm text-gray-500">Monthly Fee</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                          <div>
                            <label className="text-sm font-medium text-gray-500">Start Date</label>
                            <p className="text-sm text-gray-900">{formatDate(latestMembership.startDate)}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">End Date</label>
                            <p className="text-sm text-gray-900">{formatDate(latestMembership.endDate)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <p className="text-gray-500">No membership found</p>
                )}
              </div>
            </div>

            {/* Membership History */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Membership History</h3>
              </div>
              <div className="overflow-x-auto">
                {studentData.memberships && studentData.memberships.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {studentData.memberships.map((membership, index) => {
                        const today = new Date();
                        const endDate = new Date(membership.endDate);
                        const isActive = endDate >= today;
                        
                        return (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {membership.type || membership.membershipType}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ₱{membership.fee || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(membership.startDate)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(membership.endDate)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                isActive 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {isActive ? 'Active' : 'Expired'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="px-6 py-4">
                    <p className="text-gray-500">No membership history found</p>
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