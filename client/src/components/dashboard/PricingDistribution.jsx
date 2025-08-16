// File: client/src/components/dashboard/PricingDistribution.jsx
// Lines 1-10: Component for pricing distribution and revenue analysis
// Extracted from DashboardPage.jsx lines 505-580
import React from 'react';

/**
 * PricingDistribution Component
 * Displays pricing tiers and revenue breakdown
 * Follows DRY principle by consolidating pricing display logic
 * 
 * @param {Object} props - Component props
 * @param {Object} props.pricingBreakdown - Revenue and pricing data
 */
const PricingDistribution = ({ pricingBreakdown = {} }) => {
  // Lines 15-20: Early return for empty data (YAGNI principle)
  if (!pricingBreakdown || pricingBreakdown.total === 0) {
    return null;
  }

  // Lines 25-45: Pricing tier configuration
  const pricingTiers = [
    {
      title: "Legacy Students",
      count: pricingBreakdown.legacy || 0,
      monthlyRate: 1000,
      revenue: pricingBreakdown.legacyRevenue || 0,
      colorClass: "purple",
      icon: "🌟"
    },
    {
      title: "Current Rate Students", 
      count: pricingBreakdown.current || 0,
      monthlyRate: 1200,
      revenue: pricingBreakdown.currentRevenue || 0,
      colorClass: "blue",
      icon: "👨‍🎓"
    },
    {
      title: "Total Monthly Revenue",
      count: pricingBreakdown.totalMonthly || 0,
      monthlyRate: null,
      revenue: null,
      colorClass: "green", 
      icon: "💰",
      isTotal: true
    }
  ];

  // Lines 50-55: Calculate average revenue per student
  const averagePerStudent = pricingBreakdown.total > 0 
    ? Math.round(pricingBreakdown.totalMonthly / pricingBreakdown.total)
    : 0;

  // Lines 60-140: Main render
  return (
    <div className="bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-xl border border-gray-600 p-6 mb-8">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        <span className="mr-2">📊</span>
        Pricing Distribution
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {pricingTiers.map((tier, index) => (
          <div 
            key={index}
            className={`text-center p-4 bg-${tier.colorClass}-500 bg-opacity-20 rounded-lg border border-${tier.colorClass}-500`}
          >
            <div className={`text-2xl font-bold text-${tier.colorClass}-400`}>
              {tier.isTotal 
                ? `$${tier.count.toLocaleString()}`
                : tier.count
              }
            </div>
            <div className={`text-sm text-${tier.colorClass}-300 flex items-center justify-center gap-1`}>
              <span>{tier.icon}</span>
              <span>{tier.title}</span>
            </div>
            
            {!tier.isTotal && (
              <div className="text-xs text-gray-400 mt-1">
                ${tier.revenue.toLocaleString()}/month
              </div>
            )}
            
            {tier.isTotal && (
              <div className="text-xs text-gray-400 mt-1">
                Avg: ${averagePerStudent}/student
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Lines 145-160: Additional revenue insights */}
      <div className="mt-4 pt-4 border-t border-gray-600">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-400">
          <div>
            <span className="font-medium">Total Students:</span> {pricingBreakdown.total}
          </div>
          <div>
            <span className="font-medium">Average Revenue:</span> ${averagePerStudent}/student/month
          </div>
          <div>
            <span className="font-medium">Annual Projection:</span> ${((pricingBreakdown.totalMonthly || 0) * 12).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingDistribution;