// File: client/src/components/payment/StudentInfoCard.jsx
// Lines 1-70: Student information display card with pricing breakdown
// Extracted from PaymentModal.jsx (Lines 398-435)
// Shows student details and their personalized pricing rates

/**
 * StudentInfoCard Component
 * Line 10-15: Displays student name, email, and pricing tier breakdown
 * Shows monthly and yearly rates with grandfathered pricing indicator
 * Only renders when student data is available
 * 
 * @param {Object} props
 * @param {Object} props.student - Student object with name and email
 * @param {Object} props.studentPricing - Pricing object with monthly/yearly rates
 * @param {boolean} props.pricingLoading - Whether pricing is being fetched
 * @returns {JSX.Element|null} Student info card or null if no student
 */
const StudentInfoCard = ({ student, studentPricing, pricingLoading }) => {
  // Line 20-22: Don't render if no student selected
  if (!student) return null;

  return (
    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
      {/* Line 28-35: Student basic info - name and email */}
      <div className="flex items-center space-x-2 mb-1">
        <span>👤</span>
        <p className="font-medium text-blue-900">{student.name}</p>
      </div>
      <p className="text-sm text-blue-700 ml-6">{student.email}</p>
      
      {/* Line 38-65: Pricing breakdown - only show when loaded */}
      {studentPricing && !pricingLoading && (
        <div className="mt-3 ml-6 p-3 bg-white rounded border">
          <p className="text-sm font-medium text-gray-700 mb-2">Individual Rates</p>
          
          {/* Line 43-58: Monthly and yearly pricing grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {/* Monthly rate */}
            <div className="text-center p-2 bg-blue-50 rounded">
              <div className="font-semibold text-blue-900">
                ₱{studentPricing.monthly?.toLocaleString()}
              </div>
              <div className="text-xs text-blue-600">Monthly</div>
            </div>
            
            {/* Yearly rate */}
            <div className="text-center p-2 bg-green-50 rounded">
              <div className="font-semibold text-green-900">
                ₱{studentPricing.yearly?.toLocaleString()}
              </div>
              <div className="text-xs text-green-600">Yearly</div>
            </div>
          </div>
          
          {/* Line 62-65: Grandfathered pricing indicator */}
          {studentPricing.isLegacy && (
            <p className="text-xs text-purple-600 mt-2">🌟 Grandfathered pricing</p>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentInfoCard;