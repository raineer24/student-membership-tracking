// File: client/src/components/dashboard/PricingDistribution.jsx
import React from 'react';

const PricingDistribution = ({ pricingBreakdown = {} }) => {
  if (!pricingBreakdown.total) return null;
  
  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-8">
      <h3 className="text-white text-lg mb-4">Pricing Distribution</h3>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-purple-400">Legacy: {pricingBreakdown.legacy || 0}</p>
          <p className="text-sm text-gray-400">₱{(pricingBreakdown.legacyRevenue || 0).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-blue-400">Standard: {pricingBreakdown.current || 0}</p>
          <p className="text-sm text-gray-400">₱{(pricingBreakdown.currentRevenue || 0).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-green-400">Total: {pricingBreakdown.total || 0}</p>
          <p className="text-sm text-gray-400">₱{(pricingBreakdown.totalMonthly || 0).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

export default PricingDistribution;