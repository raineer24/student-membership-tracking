// File: client/src/components/MonthlyFrequencyWidget.jsx
// Lines 1-150: Monthly Training Frequency Widget Component
// Purpose: Display student's training frequency to help with payment decisions

import React, { useMemo } from 'react';
import { calculateMonthlyFrequency } from '../utils/studentCalculations';

/**
 * MonthlyFrequencyWidget Component
 * Lines 10-150: Shows training frequency stats with visual indicators
 * 
 * Usage: Add to StudentProfileView to show monthly frequency data
 * 
 * @param {Array} trainingSessions - Student's training session history
 * @param {number} daysOverdue - How many days payment is overdue (negative number)
 * @param {boolean} compact - If true, shows minimal badge version (for dashboard cards)
 */
const MonthlyFrequencyWidget = ({ 
  trainingSessions = [], 
  daysOverdue = 0,
  compact = false 
}) => {
  
  // Lines 25-30: Calculate frequency data using utility function
  const frequencyData = useMemo(() => 
    calculateMonthlyFrequency(trainingSessions),
    [trainingSessions]
  );

  // Lines 32-45: Compact Badge View (for Dashboard student cards - Phase 2)
  if (compact) {
    const colorClasses = {
      high: 'bg-green-500 bg-opacity-20 text-green-400 border-green-500',
      medium: 'bg-yellow-500 bg-opacity-20 text-yellow-400 border-yellow-500',
      low: 'bg-red-500 bg-opacity-20 text-red-400 border-red-500',
      none: 'bg-gray-500 bg-opacity-20 text-gray-400 border-gray-500'
    };

    return (
      <div 
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${colorClasses[frequencyData.level]}`}
        title={`${frequencyData.count} sessions in last 30 days - ${frequencyData.label}`}
      >
        <span>{frequencyData.emoji}</span>
        <span>{frequencyData.count}/mo</span>
      </div>
    );
  }

  // Lines 48-150: Full Widget View (for StudentProfileView)
  const colorClasses = {
    high: 'bg-green-900 border-green-500 text-green-400',
    medium: 'bg-yellow-900 border-yellow-500 text-yellow-400',
    low: 'bg-red-900 border-red-500 text-red-400',
    none: 'bg-gray-900 border-gray-500 text-gray-400'
  };

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-600 shadow-lg overflow-hidden mb-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-6 py-4 border-b border-gray-600">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <span className="mr-2">📊</span>
            Monthly Training Frequency
          </h3>
          {/* Frequency Badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold border-2 ${
            frequencyData.level === 'high' ? 'bg-green-500 text-white border-green-400' :
            frequencyData.level === 'medium' ? 'bg-yellow-500 text-black border-yellow-400' :
            frequencyData.level === 'low' ? 'bg-red-500 text-white border-red-400' :
            'bg-gray-500 text-white border-gray-400'
          }`}>
            <span className="text-xl">{frequencyData.emoji}</span>
            <span>{frequencyData.count} sessions/month</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Monthly Sessions */}
          <div className="bg-gray-750 rounded-lg p-4 text-center border border-gray-600">
            <div className="text-3xl font-bold text-blue-400 mb-1">
              {frequencyData.count}
            </div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">
              Sessions (30d)
            </div>
          </div>

          {/* Days Overdue */}
          <div className="bg-gray-750 rounded-lg p-4 text-center border border-gray-600">
            <div className={`text-3xl font-bold mb-1 ${
              daysOverdue >= 0 ? 'text-green-400' : 
              daysOverdue > -7 ? 'text-yellow-400' : 
              'text-red-400'
            }`}>
              {daysOverdue}
            </div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">
              Days {daysOverdue >= 0 ? 'Early' : 'Overdue'}
            </div>
          </div>

          {/* Engagement Level */}
          <div className="bg-gray-750 rounded-lg p-4 text-center border border-gray-600">
            <div className={`text-lg sm:text-xl font-bold mb-1 ${
              frequencyData.level === 'high' ? 'text-green-400' :
              frequencyData.level === 'medium' ? 'text-yellow-400' :
              frequencyData.level === 'low' ? 'text-red-400' :
              'text-gray-400'
            }`}>
              {frequencyData.label}
            </div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">
              Engagement
            </div>
          </div>
        </div>

        {/* Decision Guidance Card */}
        <div className={`p-4 rounded-lg border-2 ${colorClasses[frequencyData.level]}`}>
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">💡</span>
            <div className="flex-1">
              <h4 className="font-bold text-white mb-2">
                Payment Decision Guidance
              </h4>
              <p className="text-sm text-gray-300">
                {frequencyData.recommendation}
              </p>
            </div>
          </div>
        </div>

        {/* Visual Training Pattern (Last 10 sessions) */}
        {trainingSessions && trainingSessions.length > 0 && (
          <div className="bg-gray-750 rounded-lg p-4 border border-gray-600">
            <h4 className="text-sm font-semibold text-gray-300 mb-3">
              Recent Training Pattern (Last 10 Sessions)
            </h4>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {trainingSessions.slice(0, 10).map((session, index) => {
                const statusColor = 
                  session.attendanceStatus === 'PRESENT' ? 'bg-green-500' :
                  session.attendanceStatus === 'LATE' ? 'bg-yellow-500' :
                  session.attendanceStatus === 'ABSENT' ? 'bg-red-500' :
                  'bg-gray-500';
                
                return (
                  <div
                    key={index}
                    className={`h-8 rounded ${statusColor}`}
                    title={`${new Date(session.sessionDate).toLocaleDateString()}: ${session.attendanceStatus}`}
                  />
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-3">
              <span>🟢 Present</span>
              <span>🟡 Late</span>
              <span>🔴 Absent</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonthlyFrequencyWidget;