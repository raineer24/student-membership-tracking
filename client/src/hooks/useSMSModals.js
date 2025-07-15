// Line 1: Hook for managing SMS credits and history modals
import { useState, useCallback } from "react";
import { useToast } from "./useToast";

export const useSMSModals = (token) => {
  const [creditsModalOpen, setCreditsModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [creditsData, setCreditsData] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const { showError } = useToast();

  const fetchCredits = useCallback(async () => {
    setModalLoading(true);
    setCreditsModalOpen(true);

    try {
      const response = await fetch("/api/reminders", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      setHistoryData(result.data);
    } catch (error) {
      showError(`Failed to fetch history: ${error.message}`);
      setHistoryData(null);
    } finally {
      setModalLoading(false);
    }
  }, [token, showError]);

  const closeCreditsModal = () => setCreditsModalOpen(false);
  const closeHistoryModal = () => setHistoryModalOpen(false);

  return {
    creditsModalOpen,
    historyModalOpen,
    creditsData,
    historyData,
    modalLoading,
    fetchCredits,
    fetchHistory,
    closeCreditsModal,
    closeHistoryModal,
  };
};
