// File: client/src/utils/paymentDateUtils.js
// Lines 1-50: Pure date manipulation functions for payment forms
// Extracted from PaymentModal.jsx (Lines 358-395)
// Zero business logic - just date formatting utilities

/**
 * Formats a Date object to YYYY-MM-DD string format
 * Line 10: Used for HTML date inputs which require ISO format
 * @param {Date} date - JavaScript Date object
 * @returns {string} Formatted date string (YYYY-MM-DD)
 */
export const formatDate = (date) => {
  const localDate = new Date(date);
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const day = String(localDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Converts YYYY-MM-DD string to human-readable display format
 * Line 25: Shows "Today" for current date, otherwise "Mon, Jan 15" format
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {string} Display-friendly date string
 */
export const getDisplayDate = (dateString) => {
  if (!dateString) return "";

  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const today = new Date();

  const todayStr = formatDate(today);
  if (dateString === todayStr) return "Today";

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

/**
 * Gets maximum allowed date (today) for payment date picker
 * Line 48: Prevents future-dated payments
 * @returns {string} Today's date in YYYY-MM-DD format
 */
export const getMaxDate = () => formatDate(new Date());

/**
 * Gets minimum allowed date (30 days ago) for payment date picker
 * Line 55: Prevents payments dated more than 30 days in the past
 * @returns {string} Date 30 days ago in YYYY-MM-DD format
 */
export const getMinDate = () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return formatDate(thirtyDaysAgo);
};

/**
 * Parses YYYY-MM-DD string to Date object with proper timezone handling
 * Line 66: Ensures consistent date parsing across timezones
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {Date|null} Date object or null if invalid
 */
export const parsePaymentDate = (dateString) => {
  if (!dateString) return null;
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};