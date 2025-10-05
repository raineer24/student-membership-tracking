// File: client/src/hooks/useModalManager.js
// Lines 1-90: Complete centralized modal state management
// Clear line guidance: Extract all modal logic to reduce DashboardPage complexity

import { useState, useCallback } from "react";

/**
 * Manages all modal states and operations for the dashboard
 * Follows Single Responsibility Principle - handles only modal state
 * Preserves ALL existing modal functionality from DashboardPage
 * @returns {Object} Modal states and handlers
 */
const useModalManager = () => {
  // Lines 12-21: Consolidated modal states (replaces scattered state variables)
  const [modals, setModals] = useState({
    addStudent: false,
    editStudent: false,
    payment: false,
    training: false,
    bulkAttendance: false, // ✅ ADDED: Bulk attendance modal state
    monthlyReport: false,
    weekendEvent: false,
    credits: false,
    history: false
  });
  
  // Lines 23-27: Selected data for modals (replaces individual state variables)
  const [selectedData, setSelectedData] = useState({
    editingStudent: null,
    paymentStudent: null,
    trainingStudent: null
  });

  // Lines 29-37: Generic modal handlers (DRY principle implementation)
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

  // Lines 39-52: Add Student Modal handlers
  const openAddStudent = useCallback(() => {
    openModal('addStudent');
  }, [openModal]);
  
  const closeAddStudent = useCallback(() => {
    closeModal('addStudent');
  }, [closeModal]);

  // Lines 54-67: Edit Student Modal handlers (preserves existing edit flow)
  const openEditStudent = useCallback((student) => {
    setSelectedData(prev => ({ ...prev, editingStudent: student }));
    openModal('editStudent');
  }, [openModal]);
  
  const closeEditStudent = useCallback(() => {
    setSelectedData(prev => ({ ...prev, editingStudent: null }));
    closeModal('editStudent');
  }, [closeModal]);

  // Lines 69-82: Payment Modal handlers
  const openPayment = useCallback((student) => {
    setSelectedData(prev => ({ ...prev, paymentStudent: student }));
    openModal('payment');
  }, [openModal]);

  const closePayment = useCallback(() => {
    setSelectedData(prev => ({ ...prev, paymentStudent: null }));
    closeModal('payment');
  }, [closeModal]);

  // Lines 84-97: Training Modal handlers
  const openTraining = useCallback((student) => {
    setSelectedData(prev => ({ ...prev, trainingStudent: student }));
    openModal('training');
  }, [openModal]);

  const closeTraining = useCallback(() => {
    setSelectedData(prev => ({ ...prev, trainingStudent: null }));
    closeModal('training');
  }, [closeModal]);

  // ✅ ADDED: Lines 99-110: Bulk Attendance Modal handlers
  const openBulkAttendance = useCallback(() => {
    openModal('bulkAttendance');
  }, [openModal]);
  
  const closeBulkAttendance = useCallback(() => {
    closeModal('bulkAttendance');
  }, [closeModal]);

  // Lines 112-134: Simple utility modal handlers (no data required)
  const openMonthlyReport = useCallback(() => {
    openModal('monthlyReport');
  }, [openModal]);
  
  const closeMonthlyReport = useCallback(() => {
    closeModal('monthlyReport');
  }, [closeModal]);
  
  const openWeekendEvent = useCallback(() => {
    openModal('weekendEvent');
  }, [openModal]);
  
  const closeWeekendEvent = useCallback(() => {
    closeModal('weekendEvent');
  }, [closeModal]);
  
  const openCredits = useCallback(() => {
    openModal('credits');
  }, [openModal]);
  
  const closeCredits = useCallback(() => {
    closeModal('credits');
  }, [closeModal]);
  
  const openHistory = useCallback(() => {
    openModal('history');
  }, [openModal]);
  
  const closeHistory = useCallback(() => {
    closeModal('history');
  }, [closeModal]);

  // Lines 136-167: Return comprehensive modal interface
  return {
    // Modal states - direct access for conditional rendering
    modals,
    selectedData,
    
    // Generic handlers (for future extensibility)
    openModal,
    closeModal,
    
    // Specific modal handlers (preserving exact DashboardPage behavior)
    openAddStudent,
    closeAddStudent,
    openEditStudent,
    closeEditStudent,
    openPayment,
    closePayment,
    openTraining,
    closeTraining,
    openBulkAttendance,    // ✅ ADDED: Bulk attendance opener
    closeBulkAttendance,   // ✅ ADDED: Bulk attendance closer
    
    // Utility modal handlers
    openMonthlyReport,
    closeMonthlyReport,
    openWeekendEvent,
    closeWeekendEvent,
    openCredits,
    closeCredits,
    openHistory,
    closeHistory
  };
};

export default useModalManager;