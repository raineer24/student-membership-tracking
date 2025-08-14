// File: client/src/components/modals/SMSHistoryModal.jsx
// Lines 1-120: SMS History display modal with enhanced functionality
import React from 'react';

/**
 * SMSHistoryModal Component
 * Displays SMS reminder history in table/card format
 * @param {boolean} isOpen - Modal open state
 * @param {Function} onClose - Close modal handler
 * @param {Object} historyData - SMS history data from API
 * @param {boolean} loading - Loading state
 */
const SMSHistoryModal = ({ isOpen, onClose, historyData, loading }) => {
  // Lines 15-17: Early return if modal is not open
  if (!isOpen) return null;

  // Lines 19-30: Enhanced close handler with keyboard support
  const handleClose = () => {
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  // Lines 32-45: Helper functions for data formatting
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      sent: { bg: 'bg-green-500', text: 'text-white', label: 'Sent' },
      failed: { bg: 'bg-red-500', text: 'text-white', label: 'Failed' },
      pending: { bg: 'bg-yellow-500', text: 'text-black', label: 'Pending' }
    };
    
    const config = statusConfig[status?.toLowerCase()] || statusConfig.pending;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  // Lines 50-55: Enhanced data validation and processing
  const reminders = historyData?.reminders || historyData?.data?.reminders || [];
  const hasHistory = Array.isArray(reminders) && reminders.length > 0;

  // Handle case where API returns different structure
  const actualReminders = historyData?.reminders || 
                          historyData?.data?.reminders || 
                          (Array.isArray(historyData) ? historyData : []);

  // Lines 60-120: Modal JSX with enhanced styling and error handling
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleClose}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div 
        className="bg-gray-800 bg-opacity-95 backdrop-blur-sm rounded-xl border border-gray-600 p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <span className="mr-2">📱</span>
            SMS History
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
            title="Close Modal"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="overflow-y-auto max-h-[60vh]">
          {loading ? (
            // Loading State
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading SMS history...</p>
            </div>
          ) : hasHistory ? (
            // History Display
            <div className="space-y-3">
              {actualReminders.map((reminder, index) => (
                <div 
                  key={reminder.id || index} 
                  className="bg-gray-700 bg-opacity-50 rounded-lg p-4 hover:bg-opacity-70 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium text-white">
                          {reminder.studentName || reminder.student?.name || 'Unknown Student'}
                        </h4>
                        {getStatusBadge(reminder.status)}
                      </div>
                      
                      <div className="text-sm text-gray-400 space-y-1">
                        {(reminder.phone || reminder.student?.phone) && (
                          <div>📞 {reminder.phone || reminder.student?.phone}</div>
                        )}
                        <div>📅 {formatDate(reminder.sentAt || reminder.createdAt)}</div>
                        {reminder.message && (
                          <div className="mt-2 p-2 bg-gray-600 bg-opacity-50 rounded text-xs">
                            💬 {reminder.message}
                          </div>
                        )}
                        {reminder.network && (
                          <div className="text-xs text-blue-400">📡 {reminder.network}</div>
                        )}
                      </div>
                    </div>
                    
                    {reminder.cost && (
                      <div className="text-right">
                        <div className="text-sm text-green-400 font-medium">
                          ₱{reminder.cost.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">Cost</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Empty State
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-400 mb-2">No SMS History</h4>
              <p className="text-gray-500">No SMS reminders have been sent yet.</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-600">
          <div className="text-sm text-gray-400">
            {hasHistory && `${actualReminders.length} reminder${actualReminders.length !== 1 ? 's' : ''} found`}
            {!hasHistory && historyData && "No SMS history available"}
          </div>
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SMSHistoryModal;