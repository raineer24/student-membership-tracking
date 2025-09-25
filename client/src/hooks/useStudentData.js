// File: client/src/hooks/useStudentData.js
// Lines 1-50: Custom hook for student data processing with memoization
import { useMemo } from 'react';
import { ensureArray } from '../utils/studentTableUtils';
import { tabsConfig } from '../utils/studentStatusConfig';

/**
 * useStudentData Hook
 * Processes and memoizes student data and tab configuration for performance
 * Prevents unnecessary recalculations when props haven't changed
 * 
 * @param {Object} props - Hook parameters
 * @param {Array} props.filteredStudents - Filtered student list from parent
 * @param {Array} props.students - Complete student list from parent  
 * @param {Object} props.tabCounts - Tab count data from parent
 * @returns {Object} Processed student data with memoized computations
 */
const useStudentData = ({ filteredStudents, students, tabCounts }) => {
  // Lines 20-45: Memoized data processing - only recalculates when dependencies change
  const processedData = useMemo(() => {
    // Safe array conversion using Phase 1 utility
    const safeFilteredStudents = ensureArray(filteredStudents);
    const safeStudents = ensureArray(students);
    const safeTabCounts = tabCounts || {};

    // Generate tabs with counts using Phase 1 configuration
    const tabs = tabsConfig.map(tab => ({
      ...tab,
      count: safeTabCounts[tab.id] || 0
    }));

    // Calculate derived statistics
    const totalCount = safeStudents.length;
    const filteredCount = safeFilteredStudents.length;
    const hasStudents = filteredCount > 0;
    
    // Additional metrics for potential future use
    const showingAll = filteredCount === totalCount;
    const filterActive = !showingAll && totalCount > 0;

    return {
      // Core data arrays
      safeFilteredStudents,
      safeStudents,
      tabs,
      
      // Count metrics
      totalCount,
      filteredCount,
      hasStudents,
      
      // State indicators
      showingAll,
      filterActive
    };
  }, [filteredStudents, students, tabCounts]);

  return processedData;
};

export default useStudentData;