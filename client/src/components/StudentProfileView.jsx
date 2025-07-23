// Line 1: Complete StudentProfileView.jsx - BJJ themed with enhanced functionality
import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";

// Line 5: Main StudentProfileView component with BJJ theme
const StudentProfileView = ({ student, onBack, onEdit }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [studentData, setStudentData] = useState(null);

  // Line 12: Initialize component with provided student data
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

  // Line 23: Enhanced membership status calculation with BJJ theme colors
  const membershipStatus = useMemo(() => {
    if (!studentData?.memberships || studentData.memberships.length === 0) {
      return {
        status: "inactive",
        message: "No active membership",
        color: "text-gray-400"
      };
    }

    // Find current membership
    const latestMembership = studentData.memberships.reduce((latest, current) => {
      const currentEndDate = new Date(current.endDate);
      const latestEndDate = new Date(latest.endDate);
      return currentEndDate > latestEndDate ? current : latest;
    });

    const today = new Date();
    const endDate = new Date(latestMembership.endDate);
    
    // Clear date comparison
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    if (endDate >= today) {
      return {
        status: "active",
        message: "Membership Active",
        color: "text-green-400"
      };
    }

    // Calculate overdue status
    const timeDiff = today.getTime() - endDate.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

    if (daysDiff <= 30) {
      return {
        status: "overdue",
        message: `Overdue by ${daysDiff} day(s)`,
        color: "text-red-400"
      };
    }

    return {
      status: "inactive",
      message: `Expired ${daysDiff} days ago`,
      color: "text-gray-400"
    };
  }, [studentData]);

  // Line 67: Safe date formatting function
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "Invalid Date";
    }
  };

  // Line 77: Loading state with BJJ theme
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

  // Line 88: Error state with BJJ theme
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

  // Line 115: Main profile view render with BJJ theme
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header with BJJ theme */}
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

      {/* Content with BJJ theme */}
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
              </div>
            </div>
          </div>

          {/* Current Membership & History */}
          <div className="lg:col-span-2">
            
            {/* Current Membership Card */}
            <div className="bg-gray-800 bg-opacity-90 backdrop-blur-sm overflow-hidden shadow-xl rounded-xl border border-gray-600 mb-8">
              <div className="px-6 py-4 border-b border-gray-600">
                <h3 className="text-lg font-medium text-white">Current Membership</h3>
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
                            <p className="text-lg font-semibold text-white">
                              {latestMembership.type || latestMembership.membershipType}
                            </p>
                            <p className={`text-sm font-medium ${membershipStatus.color}`}>
                              {membershipStatus.message}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-white">
                              ₱{latestMembership.fee || 0}
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

            {/* Membership History Card */}
            <div className="bg-gray-800 bg-opacity-90 backdrop-blur-sm overflow-hidden shadow-xl rounded-xl border border-gray-600">
              <div className="px-6 py-4 border-b border-gray-600">
                <h3 className="text-lg font-medium text-white">Membership History</h3>
              </div>
              <div className="overflow-x-auto">
                {studentData.memberships && studentData.memberships.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-600">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Fee</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Start Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">End Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-600">
                      {studentData.memberships.map((membership, index) => {
                        const today = new Date();
                        const endDate = new Date(membership.endDate);
                        const isActive = endDate >= today;
                        
                        return (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                              {membership.type || membership.membershipType}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                              ₱{membership.fee || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                              {formatDate(membership.startDate)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                              {formatDate(membership.endDate)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${
                                isActive 
                                  ? 'bg-green-500 bg-opacity-20 text-green-400 border-green-500' 
                                  : 'bg-gray-500 bg-opacity-20 text-gray-400 border-gray-500'
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
                    <p className="text-gray-400">No membership history found</p>
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