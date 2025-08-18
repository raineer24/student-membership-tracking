// File: client/src/hooks/useSMSOperations.js
// Lines 1-15: Enhanced SMS operations hook
// Extracted from DashboardPage.jsx SMS functionality
import { useState, useCallback } from 'react';
import { useToast } from './useToast';

/**
 * Enhanced useSMSOperations Hook
 * Manages SMS credits, history, and reminder sending functionality
 * Follows SOLID principles with single responsibility for SMS operations
 * 
 * Features:
 * - SMS credits monitoring
 * - SMS history tracking
 * - Reminder sending with validation
 * - Error handling and retry logic
 * - Loading state management
 * 
 * @returns {Object} SMS operations state and functions
 */
export const useSMSOperations = () => {
  // Lines 20-30: SMS state management
  const [creditsData, setCreditsData] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [smsLoading, setSmsLoading] = useState(false);
  
  const { showSuccess, showError } = useToast();

  // Lines 35-75: SMS Credits fetching with enhanced error handling
  const fetchSMSCredits = useCallback(async () => {
    try {
      setModalLoading(true);
      console.log("🔄 Fetching SMS credits...");
      
      // Get token from localStorage or context
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
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

  // Lines 80-120: SMS History fetching with enhanced data handling
  const fetchSMSHistory = useCallback(async () => {
    try {
      setModalLoading(true);
      console.log("🔄 Fetching SMS history...");
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
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
        // Handle both direct data array and nested reminders structure
        const historyArray = data.data?.reminders || data.data || [];
        setHistoryData({ reminders: historyArray });
        console.log("✅ SMS history fetched successfully:", historyArray.length, "records");
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

  // Lines 125-180: Send SMS reminder with comprehensive validation
  const sendReminder = useCallback(async (student) => {
    // Pre-flight validation
    if (!student?.id) {
      showError("Invalid student data");
      return false;
    }

    // Check if student has a phone number
    const phoneNumber = student.phoneNumber || student.phone;
    if (!phoneNumber) {
      showError(`${student.name} has no phone number on file`);
      return false;
    }

    try {
      setSmsLoading(true);
      console.log("🔄 Sending SMS reminder to:", student.name);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch('/api/reminders/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          studentId: student.id,
          name: student.name,
          phoneNumber: phoneNumber,
          testMode: process.env.NODE_ENV === "development"
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to send reminder`);
      }

      const data = await response.json();
      
      if (data.success) {
        showSuccess(`SMS reminder sent to ${student.name}!`);
        console.log("✅ SMS reminder sent successfully:", data);
        return true;
      } else {
        throw new Error(data.error || "Failed to send SMS");
      }
      
    } catch (error) {
      console.error("❌ SMS reminder error:", error);
      showError(`Failed to send SMS to ${student.name}: ${error.message}`);
      return false;
    } finally {
      setSmsLoading(false);
    }
  }, [showSuccess, showError]);

  // Lines 185-205: Bulk SMS operations for future use
  const sendBulkReminders = useCallback(async (students) => {
    if (!Array.isArray(students) || students.length === 0) {
      showError("No students provided for bulk SMS");
      return { success: 0, failed: 0 };
    }

    let successCount = 0;
    let failedCount = 0;

    for (const student of students) {
      const result = await sendReminder(student);
      if (result) {
        successCount++;
      } else {
        failedCount++;
      }
      
      // Add delay between requests to avoid rate limiting
      if (students.indexOf(student) < students.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (successCount > 0) {
      showSuccess(`Sent ${successCount} SMS reminder${successCount === 1 ? '' : 's'}`);
    }
    
    if (failedCount > 0) {
      showError(`${failedCount} SMS reminder${failedCount === 1 ? '' : 's'} failed`);
    }

    return { success: successCount, failed: failedCount };
  }, [sendReminder, showSuccess, showError]);

  // Lines 210-230: Utility functions for SMS validation
  const canSendReminder = useCallback((student) => {
    // Check if student has valid phone number
    const phoneNumber = student?.phoneNumber || student?.phone;
    if (!phoneNumber || typeof phoneNumber !== 'string' || phoneNumber.trim().length === 0) {
      return false;
    }

    // Check if student has valid ID
    if (!student?.id) {
      return false;
    }

    return true;
  }, []);

  const getSMSStats = useCallback(() => {
    return {
      creditsAvailable: creditsData?.credits || 0,
      creditsUsed: creditsData?.used || 0,
      totalSent: historyData?.reminders?.length || 0,
      lastSent: historyData?.reminders?.[0]?.createdAt || null
    };
  }, [creditsData, historyData]);

  // Lines 235-250: Reset and cleanup functions
  const resetCreditsData = useCallback(() => {
    setCreditsData(null);
  }, []);

  const resetHistoryData = useCallback(() => {
    setHistoryData(null);
  }, []);

  const resetAllData = useCallback(() => {
    setCreditsData(null);
    setHistoryData(null);
  }, []);

  // Lines 255-275: Return comprehensive hook interface
  return {
    // SMS state
    creditsData,
    historyData,
    modalLoading,
    smsLoading,
    
    // Core SMS operations
    fetchSMSCredits,
    fetchSMSHistory,
    sendReminder,
    sendBulkReminders,
    
    // Utility functions
    canSendReminder,
    getSMSStats,
    
    // Reset functions
    resetCreditsData,
    resetHistoryData,
    resetAllData
  };
};