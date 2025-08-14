// File: client/src/components/modals/SMSCreditsModal.jsx
// Lines 1-80: SMS Credits display modal with enhanced functionality
import React from 'react';

/**
 * SMSCreditsModal Component
 * Displays SMS credits balance and usage statistics
 * @param {boolean} isOpen - Modal open state
 * @param {Function} onClose - Close modal handler
 * @param {Object} creditsData - SMS credits data from API
 * @param {boolean} loading - Loading state
 */
const SMSCreditsModal = ({ isOpen, onClose, creditsData, loading }) => {
  // Lines 15-17: Early return if modal is not open
  if (!isOpen) return null;

  // Lines 19-25: Enhanced close handler with keyboard support
  const handleClose = () => {
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  // Lines 30-80: Modal JSX with enhanced styling and error handling
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleClose}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div 
        className="bg-gray-800 bg-opacity-95 backdrop-blur-sm rounded-xl border border-gray-600 p-6 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <span className="mr-2">💬</span>
            SMS Credits
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
        <div className="space-y-4">
          {loading ? (
            // Loading State
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading SMS credits...</p>
            </div>
          ) : creditsData ? (
            // Credits Display
            <div className="space-y-4">
              <div className="bg-gray-700 bg-opacity-50 rounded-lg p-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400 mb-2">
                    {creditsData.remaining || creditsData.balance || 0}
                  </div>
                  <div className="text-sm text-gray-400">Credits Remaining</div>
                </div>
              </div>
              
              {(creditsData.total || creditsData.balance) && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-700 bg-opacity-30 rounded-lg p-3 text-center">
                    <div className="text-lg font-semibold text-white">
                      {creditsData.used || (creditsData.total ? creditsData.total - creditsData.remaining : 0)}
                    </div>
                    <div className="text-xs text-gray-400">Used</div>
                  </div>
                  <div className="bg-gray-700 bg-opacity-30 rounded-lg p-3 text-center">
                    <div className="text-lg font-semibold text-white">
                      {creditsData.total || creditsData.balance || 0}
                    </div>
                    <div className="text-xs text-gray-400">Total</div>
                  </div>
                </div>
              )}
              
              {/* Additional info display */}
              <div className="text-xs text-gray-400 text-center space-y-1">
                <div>Cost per SMS: ₱{creditsData.costPerSMS || 0.60}</div>
                {creditsData.provider && (
                  <div>Provider: {creditsData.provider}</div>
                )}
                {creditsData.lowBalance && (
                  <div className="text-yellow-400">⚠️ Low balance warning</div>
                )}
              </div>
            </div>
          ) : (
            // Error State
            <div className="text-center py-8">
              <div className="text-red-500 mb-2">
                <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-400">Failed to load SMS credits</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end mt-6">
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

export default SMSCreditsModal;