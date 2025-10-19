// File: client/src/components/StudentProfileView.jsx
// Enhanced with Payment Delete functionality + Training History Pagination
import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { calculateAge, formatDate, formatCurrency, ensureArray } from "../utils/profileCalculations";
import { getPaymentStatusBadge, getTrainingStatusBadge } from "../utils/profileHelpers";
import { calculateMembershipStatus } from "../utils/profileStats";

const StudentProfileView = ({ student, onBack, onEdit }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [trainingHistory, setTrainingHistory] = useState([]);
  const [trainingLoading, setTrainingLoading] = useState(false);
  const [deletingPaymentId, setDeletingPaymentId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

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
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
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
      const response = await fetch(`/api/training-sessions?studentId=${studentId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to fetch training history");
      const result = await response.json();
      const sessions = ensureArray(result.data?.sessions || result.sessions || result.data || result);
      setTrainingHistory(sessions);
      setCurrentPage(1);
    } catch (error) {
      console.error("Training history fetch error:", error);
      setTrainingHistory([]);
    } finally {
      setTrainingLoading(false);
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (deletingPaymentId) return;
    setDeletingPaymentId(paymentId);
    try {
      const response = await fetch(`/api/payments/${paymentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete payment");
      }
      setPaymentHistory(prev => prev.filter(p => p.id !== paymentId));
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Delete payment error:", error);
      alert(`Failed to delete payment: ${error.message}`);
    } finally {
      setDeletingPaymentId(null);
    }
  };

  const membershipStatus = useMemo(() => calculateMembershipStatus(studentData?.memberships), [studentData]);

  const trainingStats = useMemo(() => {
    const sessions = Array.isArray(trainingHistory) ? trainingHistory : [];
    if (sessions.length === 0) {
      return { totalSessions: 0, lastTrainingDate: null, lastTrainingText: "Never", attendanceRate: 0, daysSinceLastTraining: null, isInactive: false };
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
    return { totalSessions, lastTrainingDate, lastTrainingText: lastTrainingDate ? lastTrainingDate.toLocaleDateString() : "Never", attendanceRate, daysSinceLastTraining, isInactive };
  }, [trainingHistory]);

  const paginatedTrainingSessions = useMemo(() => {
    const totalPages = Math.ceil(trainingHistory.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentSessions = trainingHistory.slice(startIndex, endIndex);
    return { sessions: currentSessions, totalPages, startIndex, endIndex: Math.min(endIndex, trainingHistory.length), totalSessions: trainingHistory.length };
  }, [trainingHistory, currentPage, itemsPerPage]);

  const goToPage = (page) => { if (page >= 1 && page <= paginatedTrainingSessions.totalPages) setCurrentPage(page); };
  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(paginatedTrainingSessions.totalPages);
  const goToPrevPage = () => goToPage(currentPage - 1);
  const goToNextPage = () => goToPage(currentPage + 1);

  const getPageNumbers = () => {
    const pages = [];
    const totalPages = paginatedTrainingSessions.totalPages;
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const handleEditClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!onEdit || typeof onEdit !== 'function' || !studentData) {
      console.error('Edit function or student data not available');
      return;
    }
    const mappedStudentData = { ...studentData, parent: studentData.parentName || studentData.parent || "" };
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
          <button onClick={onBack} className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium">
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
              <button onClick={onBack} className="flex items-center text-gray-400 hover:text-blue-400 mb-2 transition-colors duration-200 text-sm">
                <span className="mr-2">←</span><span>Back to Dashboard</span>
              </button>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white truncate">{studentData.name || "Student Profile"}</h1>
              <div className="mt-2 flex items-center gap-3 flex-wrap">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${membershipStatus.bgColor} bg-opacity-20 ${membershipStatus.color} border border-current`}>
                  <span className="mr-2">{membershipStatus.icon}</span>{membershipStatus.message}
                </span>
                {trainingStats.isInactive && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-500 bg-opacity-20 text-red-400 border border-red-500">
                    <span className="mr-2">⚠️</span>Inactive {trainingStats.daysSinceLastTraining} days
                  </span>
                )}
              </div>
            </div>
            <button type="button" onClick={handleEditClick} className="w-full sm:w-auto bg-red-600 hover:bg-red-700 active:bg-red-800 text-white px-6 py-3 rounded-lg transition-all duration-200 font-medium">
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
                  <h3 className="text-lg font-semibold text-white flex items-center"><span className="mr-2">👤</span>Basic Information</h3>
                </div>
                <div className="p-6 space-y-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-gray-700">
                      <label className="text-sm font-medium text-gray-400">Name</label>
                      <p className="text-sm font-medium text-white text-right">{studentData.name || "N/A"}</p>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-700">
                      <label className="text-sm font-medium text-gray-400">Age</label>
                      <p className="text-sm text-white text-right">{studentData.age || (studentData.birthDate ? `${calculateAge(studentData.birthDate)} years` : "N/A")}</p>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-700">
                      <label className="text-sm font-medium text-gray-400">Parent/Guardian</label>
                      <p className="text-sm text-white text-right max-w-[150px] truncate">{studentData.parentName || studentData.parent || "N/A"}</p>
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
                      <p className="text-lg font-bold text-white">{formatCurrency(studentData.monthlyRate || 1400)}/mo</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="bg-gray-800 rounded-xl border border-gray-600 shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-6 py-4 border-b border-gray-600">
                  <h3 className="text-lg font-semibold text-white flex items-center"><span className="mr-2">🎫</span>Current Membership</h3>
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
                                <p className="text-xl font-bold text-white">{latestMembership.type || "MONTHLY"}</p>
                              </div>
                              <p className={`text-sm font-semibold ${membershipStatus.color}`}>{membershipStatus.message}</p>
                            </div>
                            <div className="text-center sm:text-right">
                              <p className="text-2xl font-bold text-white">{formatCurrency(studentData.monthlyRate || 1400)}</p>
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

          <div className="bg-gray-800 rounded-xl border border-gray-600 shadow-lg">
            <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-6 py-4 border-b border-gray-600">
              <h3 className="text-lg font-semibold text-white flex items-center"><span className="mr-2">🥋</span>Training History</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-750 rounded-lg border border-gray-600">
                  <div className="text-2xl font-bold text-blue-400 mb-1">{trainingStats.totalSessions}</div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider">Total Sessions</div>
                </div>
                <div className="text-center p-4 bg-gray-750 rounded-lg border border-gray-600">
                  <div className="text-2xl font-bold text-green-400 mb-1">{trainingStats.attendanceRate}%</div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider">Attendance Rate</div>
                </div>
                <div className="text-center p-4 bg-gray-750 rounded-lg border border-gray-600">
                  <div className="text-2xl font-bold text-purple-400 mb-1">{trainingStats.lastTrainingText}</div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider">Last Training</div>
                </div>
                <div className="text-center p-4 bg-gray-750 rounded-lg border border-gray-600">
                  <div className="text-2xl font-bold text-orange-400 mb-1">{trainingStats.daysSinceLastTraining ? `${trainingStats.daysSinceLastTraining}d` : "N/A"}</div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider">Days Since</div>
                </div>
              </div>

              {trainingLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading training history...</p>
                </div>
              ) : trainingHistory.length > 0 ? (
                <>
                  <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <span className="text-sm text-gray-400">Showing {paginatedTrainingSessions.startIndex + 1}-{paginatedTrainingSessions.endIndex} of {paginatedTrainingSessions.totalSessions} sessions</span>
                    {paginatedTrainingSessions.totalPages > 1 && (
                      <span className="text-xs bg-blue-500 bg-opacity-20 text-blue-400 px-3 py-1 rounded-full border border-blue-500">Page {currentPage} of {paginatedTrainingSessions.totalPages}</span>
                    )}
                  </div>
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-600">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400 uppercase">Date</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400 uppercase">Type</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400 uppercase">Status</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400 uppercase">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {paginatedTrainingSessions.sessions.map((session, index) => (
                          <tr key={index} className="hover:bg-gray-750 transition-colors">
                            <td className="py-3 px-4 text-sm text-white">{formatDate(session.sessionDate)}</td>
                            <td className="py-3 px-4 text-sm text-gray-300">{session.sessionType || "WEEKDAY"}</td>
                            <td className="py-3 px-4">
                              <span className={getTrainingStatusBadge(session.attendanceStatus)}>
                                {session.attendanceStatus === 'PRESENT' ? 'Present' : session.attendanceStatus === 'LATE' ? 'Late' : session.attendanceStatus === 'LEFT_EARLY' ? 'Left Early' : session.attendanceStatus === 'ABSENT' ? 'Absent' : session.attendanceStatus}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-400 max-w-xs truncate">
                              {session.notes && session.notes.trim() !== "" ? session.notes : <span className="italic text-gray-500 text-xs">no notes</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {paginatedTrainingSessions.totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-700">
                      <div className="flex items-center gap-2">
                        <button onClick={goToFirstPage} disabled={currentPage === 1} className="px-3 py-2 text-sm bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" title="First Page">⏮️ First</button>
                        <button onClick={goToPrevPage} disabled={currentPage === 1} className="px-3 py-2 text-sm bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" title="Previous Page">← Prev</button>
                        <button onClick={goToNextPage} disabled={currentPage === paginatedTrainingSessions.totalPages} className="px-3 py-2 text-sm bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" title="Next Page">Next →</button>
                        <button onClick={goToLastPage} disabled={currentPage === paginatedTrainingSessions.totalPages} className="px-3 py-2 text-sm bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" title="Last Page">Last ⏭️</button>
                      </div>
                      <div className="flex items-center gap-1 flex-wrap justify-center">
                        {getPageNumbers().map((page, index) => (
                          page === '...' ? (
                            <span key={`ellipsis-${index}`} className="px-2 text-gray-500">...</span>
                          ) : (
                            <button key={page} onClick={() => goToPage(page)} className={`px-3 py-2 text-sm rounded transition-colors ${currentPage === page ? 'bg-blue-600 text-white font-semibold' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>{page}</button>
                          )
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-500 mb-3">📅</div>
                  <p className="text-gray-400">No training sessions recorded</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl border border-gray-600 shadow-lg">
            <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-6 py-4 border-b border-gray-600">
              <h3 className="text-lg font-semibold text-white flex items-center"><span className="mr-2">💳</span>Payment History</h3>
            </div>
            <div className="p-6">
              {paymentLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading payment history...</p>
                </div>
              ) : paymentHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-600">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400 uppercase">Description</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400 uppercase">Amount</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400 uppercase">Date</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400 uppercase">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400 uppercase">Method</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {paymentHistory.slice(0, 10).map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-750 transition-colors">
                          <td className="py-3 px-4 text-sm text-white">{payment.description || "MONTHLY membership payment"}</td>
                          <td className="py-3 px-4 text-sm font-semibold text-white">{formatCurrency(payment.amount)}</td>
                          <td className="py-3 px-4 text-sm text-gray-300">{formatDate(payment.createdAt || payment.paidAt || payment.paymentDate)}</td>
                          <td className="py-3 px-4">
                            <span className={getPaymentStatusBadge(payment.status)}>{payment.status ? payment.status.charAt(0).toUpperCase() + payment.status.slice(1) : "Unknown"}</span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-400">{payment.method || payment.paymentMethod || "CASH"}</td>
                          <td className="py-3 px-4">
                            {deleteConfirm === payment.id ? (
                              <div className="flex items-center justify-center gap-2">
                                <button onClick={() => handleDeletePayment(payment.id)} disabled={deletingPaymentId === payment.id} className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50">{deletingPaymentId === payment.id ? "..." : "Confirm"}</button>
                                <button onClick={() => setDeleteConfirm(null)} disabled={deletingPaymentId === payment.id} className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50">Cancel</button>
                              </div>
                            ) : (
                              <button onClick={() => setDeleteConfirm(payment.id)} className="mx-auto block p-2 text-red-400 hover:text-red-300 hover:bg-red-900 hover:bg-opacity-20 rounded transition-colors" title="Delete payment">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-500 mb-3">💰</div>
                  <p className="text-gray-400">No payment records found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfileView;