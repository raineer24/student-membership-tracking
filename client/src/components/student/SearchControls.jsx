// File: client/src/components/student/SearchControls.jsx
// Lines 1-60: Search input with clear functionality
import React from 'react';

/**
 * SearchControls Component
 * Handles student search input with clear functionality
 * Lines 10-15: Component interface
 */
const SearchControls = ({
  searchQuery,
  isSearchActive,
  onSearchChange,
  onClearSearch,
  placeholder = "Search students by name, email, or phone..."
}) => {
  return (
    <div className="relative">
      <input
        type="text"
        placeholder={placeholder}
        value={searchQuery || ''}
        onChange={onSearchChange}
        className="block w-full pl-12 pr-12 py-3 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base min-h-[52px] transition-all duration-200"
      />
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <span className="text-gray-400 text-lg">🔍</span>
      </div>
      {isSearchActive && (
        <button
          onClick={onClearSearch}
          className="absolute inset-y-0 right-0 pr-4 flex items-center min-h-[52px] min-w-[52px] justify-center transition-colors duration-200"
          title="Clear search"
        >
          <span className="text-gray-400 hover:text-white text-lg">❌</span>
        </button>
      )}
    </div>
  );
};

export default SearchControls;