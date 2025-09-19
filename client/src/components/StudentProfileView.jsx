// File: client/src/components/StudentProfileView.jsx
// COMPLETE WORKING VERSION - Copy this entire file
import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";

const StudentProfileView = ({ student, onBack, onEdit }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [trainingHistory, setTrainingHistory] = useState([]);
  const [trainingLoading, setTrainingLoading] = useState(false);

  const ensureArray = (data) => {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object' && Array.isArray(data.sessions)) return data.sessions;
    return [];
  };

  useEffect(() => {
    if (student) {
      setStudentData(student);
      setLoading(false);
      setError(null);
      fetchPaymentHistory(student.id);
      fetchTrainingHistory(student.id);
    } else {
      setError("Student data not provided");
      setLoading(false);
    }
  }, [student]);

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
      if (!response.ok) throw new Error("Failed to fetch payment history");
      const result = await response.json();
      const payments = ensureArray(result.payments || result.data || result);
      setPaymentHistory(payments);
    } catch (error) {
      console.error("Payment history fetch error:", error);
      setPaymentHistory([]);
    } finally {
      setPaymentLoading(false);
    }
  };

  const fetchTrainingHistory = async (studentId) => {
    if (!studentId || !token) return;
    setTrainingLoading(true);
    try {
      const response = await fetch(`/api/training-sessions?studentId=${studentId}&limit=20`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch training history");
      const result = await response.json();
      const sessions = ensureArray(result.data?.sessions || result.sessions || result.data || result);
      setTrainingHistory(sessions);
    } catch (error) {
      console.error("Training history fetch error:", error);
      setTrainingHistory([]);
    } finally {
      setTrainingLoading(false);
    }
  };

  const membershipStatus = useMemo(() => {
    if (!studentData?.memberships || !Array.isArray(studentData.memberships) || studentData.memberships.length === 0) {
      return {
        status: "inactive",
        message: "No active membership",
        color: "text-gray-400",
        bgColor: "bg-gray-500",
        icon: "⚫"
      };
    }

    try {
      const latestMembership = studentData.memberships.reduce((latest, current) => {
        if (!current) return latest;
        const currentEndDate = new Date(current.endDate || 0);
        const latestEndDate = new Date(latest.endDate || 0);
        return currentEndDate > latestEndDate ? current : latest;
      });

      if (!latestMembership?.endDate) {
        return {
          status: "inactive",
          message: "No end date",
          color: "text-gray-400",
          bgColor: "bg-gray-500",
          icon: "⚫"
        };
      }

      const today = new Date();
      const endDate = new Date(latestMembership.endDate);
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
    } catch (error) {
      console.error('Membership status calculation error:', error);
      return {
        status: "inactive",
        message: "Error calculating status",
        color: "text-red-400",
        bgColor: "bg-red-500",
        icon: "❌"
      };
    }
  }, [studentData]);

  const trainingStats = useMemo(() => {
    const sessions = Array.isArray(trainingHistory) ? trainingHistory : [];
    
    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        lastTrainingDate: null,
        lastTrainingText: "Never",
        attendanceRate: 0,
        daysSinceLastTraining: null,
        isInactive: false
      };
    }

    const totalSessions = sessions.length;
    const presentSessions = sessions.filter(t => t && t.attendanceStatus === 'PRESENT').length;
    const attendanceRate = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0;

    const sortedSessions = [...sessions].sort((a, b) => {
      if (!a?.sessionDate || !b?.sessionDate) return 0;
      return new Date(b.sessionDate) - new Date(a.sessionDate);
    });
    
    const lastSession = sortedSessions[0];
    const lastTrainingDate = lastSession ? new Date(lastSession.sessionDate) : null;
    
    let daysSinceLastTraining = null;
    let isInactive = false;
    
    if (lastTrainingDate && !isNaN(lastTrainingDate.getTime())) {
      const today = new Date();
      const diffTime = today.getTime() - lastTrainingDate.getTime();
      daysSinceLastTraining = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      isInactive = daysSinceLastTraining >= 30;
    }

    return {
      totalSessions,
      lastTrainingDate,
      lastTrainingText: lastTrainingDate ? lastTrainingDate.toLocaleDateString() : "Never",
      attendanceRate,
      daysSinceLastTraining,
      isInactive
    };
  }, [trainingHistory]);

  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    try {
      const birth = new Date(birthDate);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      
      return age;
    } catch {
      return null;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "Invalid Date";
    }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "₱0";
    return `₱${parseFloat(amount).toLocaleString()}`;
  };

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

  const getTrainingStatusBadge = (status) => {
    const statusStyles = {
      PRESENT: "bg-green-500 bg-opacity-20 text-green-400 border-green-500",
      LATE: "bg-yellow-500 bg-opacity-20 text-yellow-400 border-yellow-500", 
      LEFT_EARLY: "bg-orange-500 bg-opacity-20 text-orange-400 border-orange-500",
      ABSENT: "bg-red-500 bg-opacity-20 text-red-400 border-red-500"
    };
    
    const style = statusStyles[status] || statusStyles.PRESENT;
    const displayStatus = {
      PRESENT: "Present",
      LATE: "Late", 
      LEFT_EARLY: "Left Early",
      ABSENT: "Absent"
    }[status] || status;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full border ${style}`}>
        {displayStatus}
      </span>
    );
  };

  // CRITICAL FIX: Proper field mapping
  const handleEditClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!onEdit || typeof onEdit !== 'function' || !studentData) {
      console.error('Edit function or student data not available');
      return;
    }
    
    const mappedStudentData = {
      ...studentData,
      parent: studentData.parentName || studentData.parent || "",
    };
    
    console.log('Opening edit with mapped data:', mappedStudentData);
    onEdit(mappedStudentData);
  };

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

  if (error || !studentData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-xl border border-gray-600 p-6 max-w-sm w-full text-center shadow-xl">
          <div className="text-red-500 mb-4">❌</div>
          <h3 className="text-lg font-semibold text-white mb-2">Profile Unavailable</h3>
          <p className="text-red-400 mb-6 text-sm">{error || "Student data could not be loaded"}</p>
          <button
            onClick={onBack}
            className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="bg-gray-800 shadow-xl border-b border-gray-700 sticky top-0 z-10">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 sm:py-6 gap-4">
            <div className="flex-1">
              <button
                onClick={onBack}
                className="flex items-center text-gray-400 hover:text-blue-400 mb-2 transition-colors duration-200 text-sm"
              >
                <span className="mr-2">←</span>
                <span>Back to Dashboard</span>
              </button>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white truncate">
                {studentData.name || "Student Profile"}
              </h1>
              <div className="mt-2 flex items-center gap-3 flex-wrap">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${membershipStatus.bgColor} bg-opacity-20 ${membershipStatus.color} border border-current`}>
                  <span className="mr-2">{membershipStatus.icon}</span>
                  {membershipStatus.message}
                </span>
                
                {trainingStats.isInactive && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-500 bg-opacity-20 text-red-400 border border-red-500">
                    <span className="mr-2">⚠️</span>
                    Inactive {trainingStats.daysSinceLastTraining} days
                  </span>
                )}
              </div>
            </div>
            
            <button
              type="button"
              onClick={handleEditClick}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 active:bg-red-800 text-white px-6 py-3 rounded-lg transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="lg:col-span-1">
              <div className="bg-gray-800 rounded-xl border border-gray-600 shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-6 py-4 border-b border-gray-600">
                  <h3 className="text-lg font-semibold text-white flex items-center">
                    <span className="mr-2">👤</span>
                    Basic Information
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-gray-700">
                      <label className="text-sm font-medium text-gray-400">Name</label>
                      <p className="text-sm font-medium text-white text-right">{studentData.name || "N/A"}</p>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-700">
                      <label className="text-sm font-medium text-gray-400">Age</label>
                      <p className="text-sm text-white text-right">
                        {studentData.age || (studentData.birthDate ? `${calculateAge(studentData.birthDate)} years` : "N/A")}
                      </p>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-700">
                      <label className="text-sm font-medium text-gray-400">Parent/Guardian</label>
                      <p className="text-sm text-white text-right max-w-[150px] truncate">
                        {studentData.parentName || studentData.parent || "N/A"}
                      </p>
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

            <div className="lg:col-span-2 space-y-6">
              <div className="bg-gray-800 rounded-xl border border-gray-600 shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-6 py-4 border-b border-gray-600">
                  <h3 className="text-lg font-semibold text-white flex items-center">
                    <span className="mr-2">🎫</span>
                    Current Membership
                  </h3>
                </div>
                <div className="p-6">
                  {studentData.memberships && Array.isArray(studentData.memberships) && studentData.memberships.length > 0 ? (
                    (() => {
                      const latestMembership = studentData.memberships.reduce((latest, current) => {
                        if (!current) return latest;
                        const currentEndDate = new Date(current.endDate || 0);
                        const latestEndDate = new Date(latest.endDate || 0);
                        return currentEndDate > latestEndDate ? current : latest;
                      });
                      
                      return (
                        <div className="space-y-6">
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
                      <div className="text-gray-500 mb-3">📋</div>
                      <p className="text-gray-400">No membership found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="h-6 lg:hidden" />
    </div>
  );
};

export default StudentProfileView;