// File: client/src/components/payment/PricingTierBadge.jsx
// Lines 1-40: Visual component for displaying student pricing tier
// Extracted from PaymentModal.jsx (Lines 44-65)
// Pure presentation component - no business logic

/**
 * PricingTierBadge Component
 * Line 10: Displays grandfathered pricing tier with appropriate styling
 * Shows "Founding Member", "Early Adopter", "Legacy", or "Standard"
 * 
 * @param {Object} props
 * @param {Object} props.pricing - Pricing object from useStudentPricing hook
 * @param {string} props.pricing.tier - Tier name
 * @param {boolean} props.pricing.isLegacy - Whether grandfathered pricing
 * @returns {JSX.Element|null} Badge component or null if no pricing
 */
const PricingTierBadge = ({ pricing }) => {
  // Line 20: Don't render if no pricing data
  if (!pricing) return null;
  
  // Line 23-30: Configuration object for each pricing tier
  // Each tier has unique colors and emoji for visual distinction
  const configs = {
    "Founding Member": { 
      bg: "bg-purple-100", 
      text: "text-purple-800", 
      border: "border-purple-300", 
      emoji: "🌟" 
    },
    "Early Adopter": { 
      bg: "bg-blue-100", 
      text: "text-blue-800", 
      border: "border-blue-300", 
      emoji: "🌟" 
    },
    "Legacy": { 
      bg: "bg-yellow-100", 
      text: "text-yellow-800", 
      border: "border-yellow-300", 
      emoji: "🌟" 
    },
    "Standard": { 
      bg: "bg-green-100", 
      text: "text-green-800", 
      border: "border-green-300", 
      emoji: "" 
    }
  };
  
  // Line 58: Fallback to Standard if tier not found
  const config = configs[pricing.tier] || configs["Standard"];
  
  // Line 61-70: Render badge with dynamic styling based on tier
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${config.bg} ${config.text} ${config.border}`}>
      {config.emoji && <span className="mr-1">{config.emoji}</span>}
      {pricing.tier}
    </span>
  );
};

export default PricingTierBadge;