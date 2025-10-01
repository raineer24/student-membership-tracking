// File: client/src/components/payment/PaymentDatePicker.jsx
// Lines 1-95: Payment date selection with today/custom options
// Extracted from PaymentModal.jsx (Lines 437-480)
// Provides radio button selection and date input with constraints

import { getDisplayDate, getMaxDate, getMinDate } from "../../utils/paymentDateUtils";

/**
 * PaymentDatePicker Component
 * Line 10-20: Date selection UI with two modes: Today or Custom Date
 * Enforces business rules: max 30 days in past, no future dates
 * Shows human-readable selected date display
 * 
 * @param {Object} props
 * @param {string} props.selectedOption - "today" or "custom"
 * @param {string} props.customDate - Selected custom date (YYYY-MM-DD)
 * @param {Function} props.onOptionChange - Callback when option changes
 * @param {Function} props.onDateChange - Callback when custom date changes
 * @param {boolean} props.disabled - Whether inputs should be disabled
 * @returns {JSX.Element} Date picker UI
 */
const PaymentDatePicker = ({ 
  selectedOption, 
  customDate, 
  onOptionChange, 
  onDateChange, 
  disabled = false 
}) => {
  return (
    <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
      {/* Line 35-37: Section label */}
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Payment Date
      </label>

      <div className="space-y-3">
        {/* Line 42-52: "Today" radio option */}
        <label className="flex items-center space-x-2">
          <input
            type="radio"
            name="paymentDateOption"
            value="today"
            checked={selectedOption === "today"}
            onChange={(e) => onOptionChange(e.target.value)}
            disabled={disabled}
            className="text-blue-600"
          />
          <span className="text-sm font-medium">Today</span>
        </label>
        
        {/* Line 55-65: "Different Date" radio option */}
        <label className="flex items-center space-x-2">
          <input
            type="radio"
            name="paymentDateOption"
            value="custom"
            checked={selectedOption === "custom"}
            onChange={(e) => onOptionChange(e.target.value)}
            disabled={disabled}
            className="text-blue-600"
          />
          <span className="text-sm font-medium">Different Date</span>
        </label>

        {/* Line 68-90: Custom date input (shown when custom selected) */}
        {selectedOption === "custom" && (
          <div className="ml-6">
            {/* Line 72-82: HTML5 date input with min/max constraints */}
            <input
              type="date"
              value={customDate}
              onChange={onDateChange}
              min={getMinDate()}  // 30 days ago
              max={getMaxDate()}  // Today
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
            
            {/* Line 85-90: Human-readable date display */}
            {customDate && (
              <div className="text-xs text-gray-600 mt-2">
                Selected: {getDisplayDate(customDate)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentDatePicker;