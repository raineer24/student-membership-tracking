// File: client/src/components/modals/SMSHistoryModal.jsx
// Fixed SMS History Modal with proper API integration
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const SMSHistoryModal = ({ isOpen, onClose }) => {
  const { token } = useAuth();
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch SMS history when modal opens
  useEffect(() => {
    if (isOpen && token) {
      fetchSMSHistory();
    }
  }, [isOpen, token]);

  const fetchSMSHistory = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/reminders/history?page=1&limit=50', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch SMS history`);
      }

      const result = await response.json();
      
      // Handle different response structures
      const reminders = result.data?.reminders || result.reminders || result.data || [];
      setHistoryData(Array.isArray(reminders) ? reminders : []);
    } catch (err) {
      console.error('SMS History fetch error:', err);
      setError(err.message || 'Failed to fetch SMS history');
      setHistoryData([]);
    } finally {
      setLoading(false);
    }
  };

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
      sent: { bg: 'bg-green-500', text: 'text-white', label: 'SENT' },
      failed: { bg: 'bg-red-500', text: 'text-white', label: 'FAILED' },
      pending: { bg: 'bg-yellow-500', text: 'text-black', label: 'PENDING' }
    };
    
    const config = statusConfig[status?.toLowerCase()] || statusConfig.pending;
    
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl border border-gray-600 p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <span className="mr-2">📱</span>SMS History
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading SMS history...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-500 mb-4">
                <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-400 mb-2">History Unavailable</h4>
              <p className="text-gray-500">{error}</p>
              <button
                onClick={fetchSMSHistory}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          ) : historyData.length > 0 ? (
            <div className="space-y-3">
              {historyData.map((reminder, index) => (
                <div key={reminder.id || index} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium text-white">
                          {reminder.studentName || reminder.student?.name || 'Unknown Student'}
                        </h4>
                        {getStatusBadge(reminder.status)}
                      </div>
                      
                      <div className="text-sm text-gray-400 space-y-1">
                        <div>📞 {reminder.phone || reminder.student?.phone || 'No phone'}</div>
                        <div>📅 {formatDate(reminder.sentAt || reminder.createdAt)}</div>
                        {reminder.message && (
                          <div className="mt-2 p-2 bg-gray-600 rounded text-xs">
                            💬 {reminder.message}
                          </div>
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
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-400 mb-2">No SMS History</h4>
              <p className="text-gray-500">No SMS reminders have been sent yet.</p>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-600">
          <div className="text-sm text-gray-400">
            {historyData.length > 0 && `${historyData.length} reminder${historyData.length !== 1 ? 's' : ''} found`}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SMSHistoryModal;