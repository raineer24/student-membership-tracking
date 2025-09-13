// File: client/src/components/modals/MonthlyReportModal.jsx
// Lines 1-350: Fixed Monthly Report Modal with correct API integration

import React, { useState, useCallback, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";

export default function MonthlyReportModal({ 
  isOpen, 
  onClose 
}) {
  const { token } = useAuth();
  const { showSuccess, showError } = useToast();

  // State management - Simple and focused
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return now.getMonth() + 1; // 1-12
  });
  const [selectedYear, setSelectedYear] = useState(() => {
    const now = new Date();
    return now.getFullYear();
  });

  // Month options for dropdown
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  // Year options (last 3 years + current + next year)
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear - 3; i <= currentYear + 1; i++) {
    years.push(i);
  }

  // Lines 45-80: Generate report handler - Fixed API endpoint
  const handleGenerateReport = useCallback(async () => {
    if (loading) return;

    setLoading(true);
    setReportData(null);

    try {
      console.log(`📊 Generating report for ${selectedYear}/${selectedMonth}`);

      // FIXED: Use correct API endpoint structure
      const response = await fetch(
        `/api/reports/monthly?month=${selectedMonth}&year=${selectedYear}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setReportData(data.data);
        showSuccess(`Monthly report for ${months[selectedMonth - 1].label} ${selectedYear} generated successfully!`);
      } else {
        throw new Error(data.message || 'Failed to generate report');
      }

    } catch (error) {
      console.error("Report generation error:", error);
      showError(`Failed to generate report: ${error.message}`);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, token, showSuccess, showError, loading, months]);

  // Lines 85-120: Export handlers - Fixed CSV download functionality
  const handleExportCSV = useCallback(async () => {
    if (loading) return;

    setLoading(true);

    try {
      console.log(`📥 Exporting CSV for ${selectedYear}/${selectedMonth}`);

      // FIXED: Use correct API endpoint for CSV export
      const response = await fetch(
        `/api/reports/monthly?month=${selectedMonth}&year=${selectedYear}&export=excel`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || `HTTP ${response.status}`);
      }

      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `monthly-report-${selectedYear}-${String(selectedMonth).padStart(2, '0')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showSuccess(`Report exported successfully!`);

    } catch (error) {
      console.error("Export error:", error);
      showError(`Failed to export report: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, token, showSuccess, showError, loading]);

  // Lines 125-135: Modal close handler with state cleanup
  const handleClose = useCallback(() => {
    setReportData(null);
    setLoading(false);
    onClose();
  }, [onClose]);

  // Lines 140-145: Clear data when modal closes
  useEffect(() => {
    if (!isOpen) {
      setReportData(null);
    }
  }, [isOpen]);

  // Lines 150-155: Don't render if modal is closed
  if (!isOpen) return null;

  // Lines 160-350: Enhanced dark theme modal - Professional business interface
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-white">Monthly Payment Report</h2>
            <p className="text-sm text-gray-400 mt-1">Generate comprehensive payment analytics and export data</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-700 transition-colors"
          >
            ×
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          
          {/* Report Controls */}
          <div className="bg-gray-900 rounded-lg p-4 mb-6 border border-gray-600">
            <h3 className="text-lg font-medium text-white mb-4">Report Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Month Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  disabled={loading}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                >
                  {months.map(month => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  disabled={loading}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                >
                  {years.map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col justify-end">
                <button
                  onClick={handleGenerateReport}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    'Generate Report'
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Report Results */}
          {reportData && (
            <div className="space-y-6">
              
              {/* Summary Statistics */}
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-600">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-white">
                    {reportData.reportMetadata?.monthName || 'Report'} {reportData.reportMetadata?.year || selectedYear} Summary
                  </h3>
                  <button
                    onClick={handleExportCSV}
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 transition-colors flex items-center"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    ) : (
                      <span className="mr-2">📥</span>
                    )}
                    Export CSV
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-800 rounded-lg p-3">
                    <div className="text-2xl font-bold text-green-400">{reportData.summary?.studentsWhoPaid || 0}</div>
                    <div className="text-sm text-gray-400">Students Paid</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3">
                    <div className="text-2xl font-bold text-blue-400">₱{(reportData.summary?.totalRevenue || 0).toLocaleString()}</div>
                    <div className="text-sm text-gray-400">Total Revenue</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3">
                    <div className="text-2xl font-bold text-yellow-400">{reportData.summary?.totalPayments || 0}</div>
                    <div className="text-sm text-gray-400">Total Payments</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3">
                    <div className="text-2xl font-bold text-purple-400">₱{(reportData.summary?.averagePayment || 0).toLocaleString()}</div>
                    <div className="text-sm text-gray-400">Avg Payment</div>
                  </div>
                </div>
              </div>

              {/* Pricing Breakdown */}
              {reportData.pricingBreakdown && (
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-600">
                  <h3 className="text-lg font-medium text-white mb-4">Pricing Tier Breakdown</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-800 rounded-lg p-3">
                      <div className="text-lg font-semibold text-orange-400">Founding (₱1,200)</div>
                      <div className="text-sm text-gray-400">{reportData.pricingBreakdown.founding?.count || 0} students</div>
                      <div className="text-lg font-bold text-white">₱{(reportData.pricingBreakdown.founding?.revenue || 0).toLocaleString()}</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-3">
                      <div className="text-lg font-semibold text-yellow-400">Early (₱1,300)</div>
                      <div className="text-sm text-gray-400">{reportData.pricingBreakdown.early?.count || 0} students</div>
                      <div className="text-lg font-bold text-white">₱{(reportData.pricingBreakdown.early?.revenue || 0).toLocaleString()}</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-3">
                      <div className="text-lg font-semibold text-green-400">Standard (₱1,400)</div>
                      <div className="text-sm text-gray-400">{reportData.pricingBreakdown.standard?.count || 0} students</div>
                      <div className="text-lg font-bold text-white">₱{(reportData.pricingBreakdown.standard?.revenue || 0).toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Methods */}
              {reportData.paymentMethods && Object.keys(reportData.paymentMethods).length > 0 && (
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-600">
                  <h3 className="text-lg font-medium text-white mb-4">Payment Methods</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(reportData.paymentMethods).map(([method, count]) => (
                      <div key={method} className="bg-gray-800 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-blue-400">{count}</div>
                        <div className="text-sm text-gray-400">{method}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Payments Table */}
              {reportData.payments && reportData.payments.length > 0 && (
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-600">
                  <h3 className="text-lg font-medium text-white mb-4">Payment Details</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-300">
                      <thead className="text-xs text-gray-400 uppercase bg-gray-800">
                        <tr>
                          <th className="px-4 py-3">Student</th>
                          <th className="px-4 py-3">Amount</th>
                          <th className="px-4 py-3">Method</th>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Tier</th>
                        </tr>
                      </thead>
                      <tbody className="bg-gray-800 divide-y divide-gray-700">
                        {reportData.payments.slice(0, 10).map((payment, index) => (
                          <tr key={payment.id || index} className="hover:bg-gray-700">
                            <td className="px-4 py-3 font-medium text-white">{payment.studentName || 'Unknown'}</td>
                            <td className="px-4 py-3">₱{(payment.amount || 0).toLocaleString()}</td>
                            <td className="px-4 py-3">{payment.method || 'CASH'}</td>
                            <td className="px-4 py-3">{payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : 'N/A'}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                payment.studentTier === 'Legacy' 
                                  ? 'bg-orange-900 text-orange-300' 
                                  : 'bg-green-900 text-green-300'
                              }`}>
                                {payment.studentTier || 'Standard'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {reportData.payments.length > 10 && (
                    <div className="mt-3 text-sm text-gray-400 text-center">
                      Showing first 10 payments of {reportData.payments.length} total. Export CSV for complete data.
                    </div>
                  )}
                </div>
              )}

              {/* Missed Payments Alert */}
              {reportData.missedPayments && reportData.missedPayments.length > 0 && (
                <div className="bg-red-900 border border-red-700 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-red-300 mb-4">
                    Active Students Who Did Not Pay ({reportData.missedPayments.length})
                  </h3>
                  <div className="space-y-2">
                    {reportData.missedPayments.map((student, index) => (
                      <div key={student.id || index} className="flex justify-between items-center bg-red-800 rounded-lg p-3">
                        <div>
                          <div className="font-medium text-red-200">{student.name}</div>
                          <div className="text-sm text-red-400">
                            Expected: ₱{(student.expectedAmount || 0).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-sm text-red-400">
                          Membership until: {student.membershipEndDate ? new Date(student.membershipEndDate).toLocaleDateString() : 'Unknown'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* No data message */}
          {!loading && !reportData && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-gray-400">Select a month and year, then click "Generate Report" to view payment data.</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end items-center p-6 border-t border-gray-700 bg-gray-900">
          <button
            onClick={handleClose}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}