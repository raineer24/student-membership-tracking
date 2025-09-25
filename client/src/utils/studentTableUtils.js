// File: client/src/utils/studentTableUtils.js
// Lines 1-25: Pure utility functions for student table operations

/**
 * Ensures input is an array, returns empty array if not
 * @param {any} data - Input data to validate
 * @returns {Array} Valid array or empty array
 */
export const ensureArray = (data) => {
  if (Array.isArray(data)) return data;
  return [];
};

/**
 * Safely extracts student properties with fallbacks
 * @param {Object} student - Student object
 * @returns {Object} Normalized student data
 */
export const normalizeStudentData = (student) => {
  if (!student || typeof student !== 'object') {
    return {
      name: 'Unknown Student',
      email: 'No email',
      phone: 'No phone',
      monthlyRate: 1400,
      isLegacy: false
    };
  }

  const studentName = String(student.name || 'Unknown Student');
  const studentEmail = String(student.email || 'No email');
  const studentPhone = String(student.phone || student.phoneNumber || 'No phone');
  const monthlyRate = parseFloat(student.monthlyRate || student.rate || 1400);
  const isLegacy = student.isLegacyStudent || monthlyRate < 1400;

  return {
    name: studentName,
    email: studentEmail,
    phone: studentPhone,
    monthlyRate,
    isLegacy
  };
};

/**
 * Creates safe function wrapper with error handling
 * @param {Function} fn - Function to wrap
 * @param {string} errorContext - Context for error logging
 * @returns {Function} Safe function wrapper
 */
export const createSafeHandler = (fn, errorContext) => {
  if (!fn || typeof fn !== 'function') {
    console.error(`${errorContext} not provided or not a function`);
    return () => {};
  }
  return fn;
};