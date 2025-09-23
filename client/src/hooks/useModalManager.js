// File: client/src/hooks/useModalManager.js
// Lines 1-85: Centralized modal state management
// Clear line guidance: Extract all modal logic to reduce DashboardPage complexity

import { useState, useCallback } from "react";

/**
 * Manages all modal states and operations for the dashboard
 * Follows Single Responsibility Principle - handles only modal state
 * @returns {Object} Modal states and handlers
 */
export const useModalManager = () => {
  // Lines 11-19: Consolidated modal states (was scattered across component)
  const [modals, setModals] = useState({
    addStudent: false,
    editStudent: false,
    payment: false,
    training: false,
    monthlyReport: false,
    weekendEvent: false,
    credits: false,
    history: false
  });
  
  // Lines 21-25: Selected data for modals (replaces individual state variables)
  const [selectedData, setSelectedData] = useState({
    editingStudent: null,
    paymentStudent: null,
    trainingStudent: null
  });

  // Lines 27-35: Generic modal handlers (DRY principle)
  const openModal = useCallback((modalName, data = null) => {
    setModals(prev => ({ ...prev, [modalName]: true }));
    if (data) {
      setSelectedData(prev => ({ ...prev, [`${modalName}Student`]: data }));
    }
  }, []);

  const closeModal = useCallback((modalName) => {
    setModals(prev => ({ ...prev, [modalName]: false }));
    setSelectedData(prev => ({ ...prev, [`${modalName}Student`]: null }));
  }, []);

  // Lines 37-50: Specific handlers for type safety and convenience
  const openAddStudent = useCallback(() => openModal('addStudent'), [openModal]);
  const closeAddStudent = useCallback(() => closeModal('addStudent'), [closeModal]);
  
  const openEditStudent = useCallback((student) => {
    setSelectedData(prev => ({ ...prev, editingStudent: student }));
    openModal('editStudent');
  }, [openModal]);
  
  const closeEditStudent = useCallback(() => {
    setSelectedData(prev => ({ ...prev, editingStudent: null }));
    closeModal('editStudent');
  }, [closeModal]);

  const openPayment = useCallback((student) => {
    setSelectedData(prev => ({ ...prev, paymentStudent: student }));
    openModal('payment');
  }, [openModal]);

  const closePayment = useCallback(() => {
    setSelectedData(prev => ({ ...prev, paymentStudent: null }));
    closeModal('payment');
  }, [closeModal]);

  const openTraining = useCallback((student) => {
    setSelectedData(prev => ({ ...prev, trainingStudent: student }));
    openModal('training');
  }, [openModal]);

  const closeTraining = useCallback(() => {
    setSelectedData(prev => ({ ...prev, trainingStudent: null }));
    closeModal('training');
  }, [closeModal]);

  // Lines 67-85: Return comprehensive modal interface
  return {
    // Modal states
    modals,
    selectedData,
    
    // Generic handlers (for future extensibility)
    openModal,
    closeModal,
    
    // Specific handlers (for current functionality)
    openAddStudent,
    closeAddStudent,
    openEditStudent,
    closeEditStudent,
    openPayment,
    closePayment,
    openTraining,
    closeTraining,
    
    // Simple utility handlers
    openMonthlyReport: () => openModal('monthlyReport'),
    closeMonthlyReport: () => closeModal('monthlyReport'),
    openWeekendEvent: () => openModal('weekendEvent'),
    closeWeekendEvent: () => closeModal('weekendEvent'),
    openCredits: () => openModal('credits'),
    closeCredits: () => closeModal('credits'),
    openHistory: () => openModal('history'),
    closeHistory: () => closeModal('history')
  };
};

export default useModalManager;