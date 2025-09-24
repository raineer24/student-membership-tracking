// File: client/src/hooks/useProfileData.js
// Lines 1-80: Data fetching logic extracted from StudentProfileView

import { useState } from 'react';
import { ensureArray } from '../utils/profileCalculations';

export const useProfileData = (token) => {
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [trainingHistory, setTrainingHistory] = useState([]);
  const [trainingLoading, setTrainingLoading] = useState(false);

  const fetchPaymentHistory = async (studentId) => {
    if (!studentId || !token) return;
    setPaymentLoading(true);
    try {
      const response = await fetch(`/api/payments/student/${studentId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch payment history");
      const result = await response.json();
      const payments = ensureArray(result.payments || result.data || result);
      setPaymentHistory(payments);
    } catch (error) {
      console.error("Payment history fetch error:", error);
      setPaymentHistory([]);
    } finally {
      setPaymentLoading(false);
    }
  };

  const fetchTrainingHistory = async (studentId) => {
    if (!studentId || !token) return;
    setTrainingLoading(true);
    try {
      const response = await fetch(`/api/training-sessions?studentId=${studentId}&limit=20`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch training history");
      const result = await response.json();
      const sessions = ensureArray(result.data?.sessions || result.sessions || result.data || result);
      setTrainingHistory(sessions);
    } catch (error) {
      console.error("Training history fetch error:", error);
      setTrainingHistory([]);
    } finally {
      setTrainingLoading(false);
    }
  };

  return {
    paymentHistory,
    paymentLoading,
    trainingHistory,
    trainingLoading,
    fetchPaymentHistory,
    fetchTrainingHistory,
  };
};