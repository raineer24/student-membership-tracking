// File: client/src/components/modals/SMSHistoryModal.jsx
// Lines 305-400: SMS History modal component
import React from 'react';

/**
 * SMSHistoryModal Component
 * Displays SMS history in a modal with table format
 * @param {boolean} isOpen - Modal open state
 * @param {Function} onClose - Modal close handler
 * @param {Object} historyData - SMS history data
 * @param {boolean} loading - Loading state
 */
const SMSHistoryModal = ({ isOpen, onClose, historyData, loading }) => {
  if (!isOpen) return null;

  const reminders = historyData?.reminders || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">SMS History</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-400 mt-2">Loading history...</p>
          </div>
        ) : reminders.length > 0 ? (
          <div className="overflow-y-auto max-h-96">
            <table className="w-full text-sm">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-3 py-2 text-left text-gray-300">Student</th>
                  <th className="px-3 py-2 text-left text-gray-300">Phone</th>
                  <th className="px-3 py-2 text-left text-gray-300">Status</th>
                  <th className="px-3 py-2 text-left text-gray-300">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-600">
                {reminders.map((reminder, index) => (
                  <tr key={index} className="hover:bg-gray-700">
                    <td className="px-3 py-2 text-white">{reminder.studentName || 'Unknown'}</td>
                    <td className="px-3 py-2 text-gray-300">{reminder.phoneNumber || 'N/A'}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        reminder.status === 'sent' 
                          ? 'bg-green-600 text-white' 
                          : 'bg-red-600 text-white'
                      }`}>
                        {reminder.status || 'unknown'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-300">
                      {reminder.createdAt ? new Date(reminder.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400">No SMS history found</p>
          </div>
        )}
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SMSHistoryModal;