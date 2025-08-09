// components/modals/SMSHistoryModal.jsx - FIXED VERSION
import React from 'react';

const SMSHistoryModal = ({ isOpen, onClose, historyData, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 bg-opacity-95 backdrop-blur-sm rounded-xl border border-gray-600 p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-white">SMS History</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <span className="text-2xl">×</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading SMS history...</p>
          </div>
        ) : historyData?.reminders?.length > 0 ? (
          <div className="overflow-y-auto max-h-[60vh]">
            <div className="space-y-3">
              {historyData.reminders.map((reminder, index) => (
                <div 
                  key={reminder.id || index} 
                  className="bg-gray-700 bg-opacity-50 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="text-white font-medium">
                        {reminder.student?.name || reminder.studentName || 'Unknown'}
                      </div>
                      <div className="text-sm text-gray-400">
                        Phone: {reminder.phoneNumber || reminder.phone || 'N/A'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        reminder.status === 'SENT' || reminder.status === 'TEST_SENT' || reminder.status === 'sent'
                          ? 'bg-green-500 bg-opacity-20 text-green-400' 
                          : reminder.status === 'FAILED' || reminder.status === 'failed'
                          ? 'bg-red-500 bg-opacity-20 text-red-400'
                          : 'bg-yellow-500 bg-opacity-20 text-yellow-400'
                      }`}>
                        {reminder.status || 'pending'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {reminder.sentAt 
                          ? new Date(reminder.sentAt).toLocaleString()
                          : 'Unknown time'
                        }
                      </div>
                    </div>
                  </div>
                  
                  {reminder.message && (
                    <div className="bg-gray-800 bg-opacity-50 rounded p-3 mt-2">
                      <div className="text-sm text-gray-300">
                        {reminder.message}
                      </div>
                    </div>
                  )}

                  {reminder.cost && (
                    <div className="text-xs text-gray-500 mt-2">
                      Cost: ₱{reminder.cost}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <span className="text-4xl">📱</span>
            </div>
            <p className="text-gray-400">No SMS history found</p>
            <p className="text-sm text-gray-500 mt-2">
              SMS reminders sent will appear here
            </p>
          </div>
        )}

        <div className="flex justify-end mt-6 pt-4 border-t border-gray-600">
          <button
            onClick={onClose}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SMSHistoryModal;