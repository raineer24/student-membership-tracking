// File: client/src/components/payment/QuickSelectButtons.jsx
// Lines 1-65: Monthly/Yearly membership quick select buttons
// Extracted from PaymentModal.jsx (Lines 323-370)
// Displays pricing options with visual selection state

/**
 * QuickSelectButtons Component
 * Line 10-18: Two-button selector for membership type with pricing display
 * Shows monthly and yearly options with current prices
 * Highlights selected option and shows pricing tier in label
 * 
 * @param {Object} props
 * @param {string} props.selectedType - Currently selected type ("MONTHLY" or "YEARLY")
 * @param {Object} props.prices - Object with MONTHLY and YEARLY price values
 * @param {Function} props.onSelect - Callback when type is selected
 * @param {boolean} props.disabled - Whether buttons should be disabled
 * @param {Object} props.studentPricing - Student pricing data (optional)
 * @returns {JSX.Element} Quick select button grid
 */
const QuickSelectButtons = ({ 
  selectedType, 
  prices, 
  onSelect, 
  disabled = false,
  studentPricing = null 
}) => {
  return (
    <div>
      {/* Line 32-35: Label with optional tier display */}
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Quick Select {studentPricing && `(${studentPricing.tier})`}
      </label>
      
      {/* Line 38-41: Two-column button grid */}
      <div className="grid grid-cols-2 gap-3">
        
        {/* Line 44-60: Monthly selection button */}
        <button
          type="button"
          onClick={() => onSelect("MONTHLY")}
          disabled={disabled}
          className={`p-4 rounded-lg border text-sm transition-colors disabled:opacity-50 ${
            selectedType === "MONTHLY"
              ? "bg-blue-50 border-blue-500 text-blue-700"
              : "bg-white border-gray-300 hover:bg-gray-50"
          }`}
        >
          <div className="text-center">
            <div className="font-medium">Monthly</div>
            <div className="text-lg font-bold">
              ₱{prices.MONTHLY.toLocaleString()}
            </div>
          </div>
        </button>
        
        {/* Line 63-79: Yearly selection button */}
        <button
          type="button"
          onClick={() => onSelect("YEARLY")}
          disabled={disabled}
          className={`p-4 rounded-lg border text-sm transition-colors disabled:opacity-50 ${
            selectedType === "YEARLY"
              ? "bg-blue-50 border-blue-500 text-blue-700"
              : "bg-white border-gray-300 hover:bg-gray-50"
          }`}
        >
          <div className="text-center">
            <div className="font-medium">Yearly</div>
            <div className="text-lg font-bold">
              ₱{prices.YEARLY.toLocaleString()}
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default QuickSelectButtons;