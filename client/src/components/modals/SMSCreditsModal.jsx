// components/modals/SMSCreditsModal.jsx - Lines 21-91 extracted
import React from 'react';

/**
 * Modal component for displaying SMS credits information
 * Lines 21-91 extracted from DashboardPage.jsx
 */
const SMSCreditsModal = ({ isOpen, onClose, creditsData, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 bg-opacity-95 backdrop-blur-sm rounded-xl border border-gray-600 p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-white">SMS Credits</h3>
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
            <p className="text-gray-400">Loading credits information...</p>
          </div>
        ) : creditsData ? (
          <div className="space-y-4">
            <div className="bg-gray-700 bg-opacity-50 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Available Credits</div>
              <div className="text-2xl font-bold text-white">
                {creditsData.balance || 0}
              </div>
              <div className="text-xs text-gray-500">
                ~₱{((creditsData.balance || 0) * 0.60).toFixed(2)} value
              </div>
            </div>

            <div className="bg-gray-700 bg-opacity-50 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Account Status</div>
              <div className="text-lg font-semibold text-green-400">
                {creditsData.status || 'Active'}
              </div>
            </div>

            {creditsData.lastTopUp && (
              <div className="bg-gray-700 bg-opacity-50 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Last Top-up</div>
                <div className="text-sm text-white">
                  {new Date(creditsData.lastTopUp).toLocaleDateString()}
                </div>
              </div>
            )}

            <div className="text-xs text-gray-500 text-center mt-4">
              SMS cost: ₱0.60 per message via Semaphore
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-red-400 mb-2">
              <span className="text-4xl">⚠️</span>
            </div>
            <p className="text-gray-400">Failed to load credits information</p>
            <button
              onClick={onClose}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Close
            </button>
          </div>
        )}

        <div className="flex justify-end mt-6">
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

export default SMSCreditsModal;