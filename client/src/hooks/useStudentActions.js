// File: client/src/hooks/useStudentActions.js
// Lines 1-70: Custom hook for student management actions with performance optimization
import { useCallback } from 'react';

/**
 * useStudentActions Hook
 * Centralizes student management event handlers with safe function checking
 * and useCallback optimization to prevent unnecessary re-renders
 * 
 * @param {Object} props - Hook configuration object
 * @param {Function} props.setSearchQuery - Function to update search query state
 * @param {Function} props.setIsSearchActive - Function to update search active state
 * @param {Function} props.setCurrentTab - Function to update current tab state
 * @param {Function} props.setAddStudentModalOpen - Function to open add student modal
 * @returns {Object} Memoized event handler functions
 */
const useStudentActions = ({
  setSearchQuery,
  setIsSearchActive,
  setCurrentTab,
  setAddStudentModalOpen
}) => {
  // Lines 25-40: Search handling with useCallback optimization
  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    
    // Safe function checking to prevent runtime errors
    if (setSearchQuery && typeof setSearchQuery === 'function') {
      setSearchQuery(value);
    }
    
    if (setIsSearchActive && typeof setIsSearchActive === 'function') {
      setIsSearchActive(value.trim().length > 0);
    }
  }, [setSearchQuery, setIsSearchActive]);

  const handleClearSearch = useCallback(() => {
    // Reset search query and active state safely
    if (setSearchQuery && typeof setSearchQuery === 'function') {
      setSearchQuery("");
    }
    
    if (setIsSearchActive && typeof setIsSearchActive === 'function') {
      setIsSearchActive(false);
    }
  }, [setSearchQuery, setIsSearchActive]);

  // Lines 45-55: Tab navigation handling
  const handleTabChange = useCallback((tabId) => {
    if (setCurrentTab && typeof setCurrentTab === 'function') {
      setCurrentTab(tabId);
    }
  }, [setCurrentTab]);

  // Lines 57-62: Modal handling
  const handleAddStudent = useCallback(() => {
    if (setAddStudentModalOpen && typeof setAddStudentModalOpen === 'function') {
      setAddStudentModalOpen(true);
    }
  }, [setAddStudentModalOpen]);

  // Lines 65-70: Return stable memoized handlers
  return {
    handleSearchChange,
    handleClearSearch,
    handleTabChange,
    handleAddStudent
  };
};

export default useStudentActions;