// File: client/src/components/student/TabNavigation.jsx
// Lines 1-50: Tab navigation for student filtering
import React from 'react';

/**
 * TabNavigation Component
 * Tab-based navigation for filtering students by status
 * Lines 10-15: Component interface
 */
const TabNavigation = ({
  tabs,
  currentTab,
  onTabChange
}) => {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 px-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange && onTabChange(tab.id)}
          className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap min-h-[48px] transform active:scale-95 ${
            currentTab === tab.id
              ? "bg-blue-600 text-white shadow-lg"
              : "bg-gray-700 text-gray-300 hover:text-white hover:bg-gray-600"
          }`}
        >
          <div className="text-center">
            <div className="font-medium">{tab.label}</div>
            <div className="text-xs opacity-75">({tab.count})</div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default TabNavigation;