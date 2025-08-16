// File: client/src/hooks/useSMSOperations.js
// Lines 1-15: Enhanced imports and dependencies  
import { useState, useCallback } from 'react';
import { useToast } from './useToast';

/**
 * useSMSOperations Hook
 * Manages SMS credits, history, and reminder sending functionality
 * Extracted from DashboardPage.jsx lines 145-165, 275-320
 * 
 * @returns {Object} SMS operations state and functions
 */
export const useSMSOperations = () => {
  // Lines 15-25: SMS state management (extracted from DashboardPage lines 72-80)
  const [creditsData, setCreditsData] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [smsLoading, setSmsLoading] = useState(false);
  
  const { showSuccess, showError } = useToast();

  // Lines 30-75: SMS Credits fetching (extracted from DashboardPage lines 145-165)
  const fetchSMSCredits = useCallback(async () => {
    try {
      setModalLoading(true);
      console.log("🔄 Fetching SMS credits using enhanced API...");
      
      // Use direct API call with proper token handling
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reminders/credits', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch credits`);
      }

      const data = await response.json();
      
      if (data.success) {
        setCreditsData(data.data);
        console.log("✅ SMS credits fetched successfully:", data.data);
      } else {
        throw new Error(data.error || "Failed to load credits");
      }

    } catch (error) {
      console.error("❌ SMS credits error:", error);
      showError("Failed to load SMS credits");
      setCreditsData(null);
    } finally {
      setModalLoading(false);
    }
  }, [showError]);

  // Lines 80-125: SMS History fetching (extracted from DashboardPage)
  const fetchSMSHistory = useCallback(async () => {
    try {
      setModalLoading(true);
      console.log("🔄 Fetching SMS history using enhanced API...");
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reminders/history', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch history`);
      }

      const data = await response.json();
      
      if (data.success) {
        setHistoryData(data.data);
        console.log("✅ SMS history fetched successfully:", data.data);
      } else {
        throw new Error(data.error || "Failed to load history");
      }

    } catch (error) {
      console.error("❌ SMS history error:", error);
      showError("Failed to load SMS history");
      setHistoryData(null);
    } finally {
      setModalLoading(false);
    }
  }, [showError]);

  // Lines 130-180: Send SMS reminder functionality (extracted from DashboardPage lines 275-320)
  const sendReminder = useCallback(async (student) => {
    if (!student?.id) {
      showError("Invalid student data");
      return;
    }

    try {
      setSmsLoading(true);
      console.log("🔄 Sending SMS reminder using enhanced API...");
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reminders/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          studentId: student.id,
          testMode: process.env.NODE_ENV === "development",
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to send reminder`);
      }

      const data = await response.json();
      
      if (data.success) {
        showSuccess(`SMS reminder sent to ${student.name}!`);
        console.log("✅ SMS reminder sent successfully:", data);
        return data;
      } else {
        throw new Error(data.error || "Failed to send SMS");
      }
      
    } catch (error) {
      console.error("❌ SMS reminder error:", error);
      showError(`Failed to send SMS: ${error.message}`);
      throw error;
    } finally {
      setSmsLoading(false);
    }
  }, [showSuccess, showError]);

  // Lines 185-200: Return hook interface
  return {
    // SMS state
    creditsData,
    historyData,
    modalLoading,
    smsLoading,
    
    // SMS operations
    fetchSMSCredits,
    fetchSMSHistory,
    sendReminder,
    
    // Reset functions
    resetCreditsData: () => setCreditsData(null),
    resetHistoryData: () => setHistoryData(null)
  };
};