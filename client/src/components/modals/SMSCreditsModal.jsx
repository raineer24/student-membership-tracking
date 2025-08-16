// File: client/src/components/modals/SMSCreditsModal.jsx
// Lines 225-300: SMS Credits modal component
import React from 'react';

/**
 * SMSCreditsModal Component
 * Displays SMS credits information in a modal
 * @param {boolean} isOpen - Modal open state
 * @param {Function} onClose - Modal close handler
 * @param {Object} creditsData - SMS credits data
 * @param {boolean} loading - Loading state
 */
const SMSCreditsModal = ({ isOpen, onClose, creditsData, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">SMS Credits</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-400 mt-2">Loading credits...</p>
          </div>
        ) : creditsData ? (
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Available Credits:</span>
              <span className="text-white font-medium">{creditsData.credits || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Used Credits:</span>
              <span className="text-white font-medium">{creditsData.used || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Total Credits:</span>
              <span className="text-white font-medium">{(creditsData.credits || 0) + (creditsData.used || 0)}</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-400">No credits data available</p>
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

export default SMSCreditsModal;