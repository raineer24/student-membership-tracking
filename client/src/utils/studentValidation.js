// File: client/src/utils/studentValidation.js
// Lines 1-35: Pure validation function with zero side effects
// Clear line guidance: Extract student data validation logic

/**
 * Validates and normalizes student data from various API response formats
 * @param {*} data - Raw API response data
 * @returns {Array} - Validated array of student objects
 */
export const validateStudentData = (data) => {
  // Lines 10-12: Early return for invalid input
  if (!data) {
    return [];
  }
  
  let studentsArray = [];
  
  // Lines 17-27: Handle different API response structures
  if (data.success && Array.isArray(data.students)) {
    studentsArray = data.students;
  } else if (data.success && Array.isArray(data.data)) {
    studentsArray = data.data;
  } else if (Array.isArray(data)) {
    studentsArray = data;
  } else if (data.data && Array.isArray(data.data.students)) {
    studentsArray = data.data.students;
  } else if (data.data && Array.isArray(data.data)) {
    studentsArray = data.data;
  }
  
  // Lines 29-35: Filter out invalid student objects
  return studentsArray.filter(student => 
    student && 
    typeof student === 'object' && 
    student.id && 
    student.name &&
    typeof student.name === 'string'
  );
};