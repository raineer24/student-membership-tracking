// File: client/src/components/modals/SMSCreditsModal.jsx
// Fixed SMS Credits Modal with proper API integration
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const SMSCreditsModal = ({ isOpen, onClose }) => {
  const { token } = useAuth();
  const [creditsData, setCreditsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch SMS credits when modal opens
  useEffect(() => {
    if (isOpen && token) {
      fetchSMSCredits();
    }
  }, [isOpen, token]);

  const fetchSMSCredits = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/reminders/credits', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch SMS credits`);
      }

      const result = await response.json();
      setCreditsData(result.data || result);
    } catch (err) {
      console.error('SMS Credits fetch error:', err);
      setError(err.message || 'Failed to fetch SMS credits');
      // Set default data for demo
      setCreditsData({
        balance: 0,
        currency: 'PHP',
        provider: 'Semaphore',
        lastUpdated: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl border border-gray-600 p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <span className="mr-2">💳</span>SMS Credits
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading credits...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-500 mb-4">
                <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-400 mb-2">Credits Unavailable</h4>
              <p className="text-gray-500 text-sm">{error}</p>
              <button
                onClick={fetchSMSCredits}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          ) : creditsData ? (
            <div className="space-y-4">
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-400">
                  ₱{creditsData.balance?.toFixed(2) || '0.00'}
                </div>
                <div className="text-sm text-gray-400">Available Credits</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700 rounded-lg p-3">
                  <div className="text-sm text-gray-400">Provider</div>
                  <div className="text-white font-medium">{creditsData.provider || 'Semaphore'}</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-3">
                  <div className="text-sm text-gray-400">Cost per SMS</div>
                  <div className="text-white font-medium">₱0.60</div>
                </div>
              </div>

              <div className="bg-gray-700 rounded-lg p-3">
                <div className="text-sm text-gray-400">Estimated SMS Count</div>
                <div className="text-white font-medium">
                  ~{Math.floor((creditsData.balance || 0) / 0.60)} messages
                </div>
              </div>

              {creditsData.lastUpdated && (
                <div className="text-xs text-gray-500 text-center">
                  Last updated: {new Date(creditsData.lastUpdated).toLocaleString()}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">No credits data available</p>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6">
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

export default SMSCreditsModal;