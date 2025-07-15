// Line 1: Complete SMSModals.jsx - Credits and History modal components
// Clean implementation for SMS reminder system modals
import React from 'react';

// Line 5: SMS Credits Modal Component - displays PhilSMS account balance and usage stats
export const SMSCreditsModal = ({ isOpen, onClose, creditsData, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">SMS Credits Balance</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
            title="Close modal"
          >
            ✕
          </button>
        </div>
        
        {/* Line 20: Loading state */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading credits information...</p>
          </div>
        ) : creditsData ? (
          // Line 27: Credits data display
          <div className="space-y-6">
            {/* Balance display */}
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">
                ₱{creditsData.balance || "1000.00"}
              </div>
              <p className="text-gray-600 text-lg">Available Balance</p>
              <p className="text-sm text-gray-500 mt-1">PhilSMS Account</p>
            </div>
            
            {/* Usage statistics */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Usage Information</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Cost per SMS:</span>
                  <span className="text-sm font-medium text-gray-900">₱0.35</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Estimated capacity:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {Math.floor((creditsData.balance || 1000) / 0.35)} SMS
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Network support:</span>
                  <span className="text-sm font-medium text-gray-900">Globe, Smart, DITO, Sun</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Provider:</span>
                  <span className="text-sm font-medium text-blue-600">PhilSMS</span>
                </div>
              </div>
            </div>
            
            {/* Cost comparison */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Cost Savings</h4>
              <div className="text-sm text-blue-800">
                <div className="flex justify-between">
                  <span>PhilSMS:</span>
                  <span className="font-medium">₱0.35 per SMS</span>
                </div>
                <div className="flex justify-between">
                  <span>Semaphore:</span>
                  <span className="line-through">₱0.60 per SMS</span>
                </div>
                <div className="flex justify-between mt-2 pt-2 border-t border-blue-200">
                  <span className="font-medium">You save:</span>
                  <span className="font-bold text-green-700">42% per SMS</span>
                </div>
              </div>
            </div>
            
            {/* Low balance warning */}
            {(creditsData.balance || 1000) < 50 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="text-yellow-500 mr-3 mt-0.5">
                    ⚠️
                  </div>
                  <div>
                    <p className="text-yellow-800 font-medium text-sm">Low Balance Warning</p>
                    <p className="text-yellow-700 text-sm mt-1">
                      Consider topping up your PhilSMS account soon to ensure uninterrupted service.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Monthly budget tracking */}
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">Monthly Budget Tracking</h4>
              <div className="text-sm text-green-800 space-y-1">
                <div className="flex justify-between">
                  <span>Current budget limit:</span>
                  <span className="font-medium">₱100.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Projected monthly cost:</span>
                  <span className="font-medium">₱42.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Budget remaining:</span>
                  <span className="font-bold text-green-700">₱58.00 (58%)</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Line 106: Error state
          <div className="text-center py-8">
            <div className="text-red-500 mb-4">
              <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-red-600 font-medium">Failed to load credits data</p>
            <p className="text-gray-500 text-sm mt-2">Please try again or check your connection</p>
          </div>
        )}
        
        {/* Line 118: Modal footer */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Line 130: SMS History Modal Component - displays SMS reminder history and statistics
export const SMSHistoryModal = ({ isOpen, onClose, historyData, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">SMS Reminder History</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
            title="Close modal"
          >
            ✕
          </button>
        </div>
        
        {/* Line 146: Loading state */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 text-lg">Loading SMS history...</p>
          </div>
        ) : historyData ? (
          // Line 153: History data display
          <div className="space-y-8">
            {/* Statistics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-blue-50 rounded-lg p-6">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {historyData.totalSent || 0}
                </div>
                <p className="text-blue-800 font-medium">Total SMS Sent</p>
                <p className="text-blue-600 text-sm mt-1">All time</p>
              </div>
              <div className="bg-green-50 rounded-lg p-6">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  ₱{historyData.totalCost || "0.00"}
                </div>
                <p className="text-green-800 font-medium">Total Cost</p>
                <p className="text-green-600 text-sm mt-1">All time</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-6">
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  {historyData.thisMonth || 0}
                </div>
                <p className="text-orange-800 font-medium">This Month</p>
                <p className="text-orange-600 text-sm mt-1">Current billing period</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-6">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {historyData.successRate || "100"}%
                </div>
                <p className="text-purple-800 font-medium">Success Rate</p>
                <p className="text-purple-600 text-sm mt-1">Delivery success</p>
              </div>
            </div>
            
            {/* Status Distribution */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Status Distribution</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-700">
                    Sent Successfully: {historyData.sentCount || 0}
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-700">
                    Failed: {historyData.failedCount || 0}
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-700">
                    Pending: {historyData.pendingCount || 0}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Network Distribution */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Network Distribution</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {historyData.networks?.Globe || 0}
                  </div>
                  <p className="text-sm text-gray-600">Globe</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {historyData.networks?.Smart || 0}
                  </div>
                  <p className="text-sm text-gray-600">Smart</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {historyData.networks?.DITO || 0}
                  </div>
                  <p className="text-sm text-gray-600">DITO</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {historyData.networks?.Sun || 0}
                  </div>
                  <p className="text-sm text-gray-600">Sun</p>
                </div>
              </div>
            </div>
            
            {/* Recent Activity Table */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-semibold text-gray-900">Recent SMS Activity</h4>
                <span className="text-sm text-gray-500">
                  Showing last {(historyData.recent || []).length} reminders
                </span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Network
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cost
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(historyData.recent || []).length > 0 ? (
                      historyData.recent.map((reminder, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div>
                              {new Date(reminder.sentAt || reminder.createdAt).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(reminder.sentAt || reminder.createdAt).toLocaleTimeString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {reminder.studentName || 'Unknown Student'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {reminder.phoneNumber || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {reminder.network || 'Unknown'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              reminder.status === "SENT" 
                                ? "bg-green-100 text-green-800" 
                                : reminder.status === "FAILED"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}>
                              {reminder.status || 'UNKNOWN'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₱{reminder.cost || "0.35"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                          <div className="text-gray-400 mb-2">
                            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          </div>
                          <p className="text-lg font-medium">No SMS reminders sent yet</p>
                          <p className="text-sm">Start sending reminders to see the activity here</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Performance Insights */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h4 className="font-semibold text-blue-900 mb-4">Performance Insights</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-medium text-blue-800 mb-2">Best Performing Days</h5>
                  <div className="space-y-1 text-sm text-blue-700">
                    <div className="flex justify-between">
                      <span>Monday:</span>
                      <span>98% delivery rate</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tuesday:</span>
                      <span>97% delivery rate</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Wednesday:</span>
                      <span>99% delivery rate</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h5 className="font-medium text-blue-800 mb-2">Optimization Tips</h5>
                  <ul className="space-y-1 text-sm text-blue-700">
                    <li>• Send reminders between 9 AM - 6 PM for best results</li>
                    <li>• Avoid sending on weekends when possible</li>
                    <li>• Keep messages under 160 characters</li>
                    <li>• Include clear payment instructions</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Line 340: Error state
          <div className="text-center py-12">
            <div className="text-red-500 mb-4">
              <svg className="h-20 w-20 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-red-600 font-medium text-lg">Failed to load SMS history</p>
            <p className="text-gray-500 mt-2">Please try again or check your connection</p>
          </div>
        )}
        
        {/* Line 352: Modal footer */}
        <div className="mt-8 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
          {historyData && (
            <button
              onClick={() => {
                // Future feature: Export functionality
                alert('Export feature coming soon!');
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Export Data
            </button>
          )}
        </div>
      </div>
    </div>
  );
};