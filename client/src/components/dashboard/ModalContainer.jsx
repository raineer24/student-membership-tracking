// File: client/src/components/dashboard/ModalContainer.jsx
// Lines 1-145: Centralized modal rendering container
// Purpose: Single Responsibility - handles ONLY modal rendering and orchestration
// Dependencies: 7 modal components + StudentEditForm wrapper

import React from "react";
import AddStudentModal from "../AddStudentModal";
import PaymentModal from "../PaymentModal";
import TrainingSessionModal from "../training/TrainingSessionModal";
import SMSCreditsModal from "../modals/SMSCreditsModal";
import SMSHistoryModal from "../modals/SMSHistoryModal";
import WeekendEventModal from "../modals/WeekendEventModal";
import MonthlyReportModal from "../modals/MonthlyReportModal";
import StudentEditForm from "../StudentEditForm";

// Lines 16-50: Edit Student Modal Component (inline modal wrapper)
// Provides modal chrome (backdrop, header, close button) for StudentEditForm
const EditStudentModal = ({ isOpen, student, onClose, onSave }) => {
  // Lines 19-20: Early return pattern - don't render if modal closed or no student
  if (!isOpen || !student) return null;

  return (
    // Lines 23-24: Full-screen backdrop with centered flex layout
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      {/* Lines 25-27: Modal container - responsive width with scroll capability */}
      <div className="bg-gray-800 rounded-xl border border-gray-600 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Lines 28-43: Modal header section */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">
            Edit Student Profile
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl focus:outline-none focus:ring-2 focus:ring-gray-500"
            title="Close"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
        {/* Lines 44-52: Form content area - zero padding to allow form to control spacing */}
        <div className="p-0">
          <StudentEditForm
            student={student}
            onSave={onSave}
            onBack={onClose}
            isModal={true}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Lines 56-80: ModalContainer Component Documentation
 * 
 * Purpose: Centralized modal orchestration following SOLID principles
 * 
 * Architecture Benefits:
 * - Single Responsibility: Only renders modals, no business logic
 * - Open/Closed: Add new modals without modifying existing ones
 * - Interface Segregation: Each modal gets only required props
 * - Dependency Inversion: Depends on abstractions (handlers), not concrete implementations
 * 
 * Props Interface:
 * @param {Object} modals - Modal visibility state from useModalManager hook
 *   Structure: { addStudent: bool, editStudent: bool, payment: bool, ... }
 * 
 * @param {Object} selectedData - Context data for modals
 *   Structure: { editingStudent: obj, paymentStudent: obj, trainingStudent: obj }
 * 
 * @param {Object} handlers - Callback functions for modal lifecycle
 *   Required: open/close functions, success callbacks, data handlers
 * 
 * @param {Array} students - Complete students list for modals needing full context
 *   Used by: WeekendEventModal (recipient selection), MonthlyReportModal (reporting)
 * 
 * Maintenance Notes:
 * - Each modal section is clearly commented with line numbers
 * - All modals follow consistent prop naming conventions
 * - Critical callbacks (like onEventCreated) are documented inline
 */
const ModalContainer = ({ modals, selectedData, handlers, students }) => {
  return (
    <>
      {/* Lines 83-88: Add Student Modal
          Functionality: New student registration and profile creation
          Triggers: "Add Student" button in dashboard header
          Success flow: calls handleAddStudent → updates student list → closes modal */}
      <AddStudentModal
        isOpen={modals.addStudent}
        onClose={handlers.closeAddStudent}
        onStudentAdded={handlers.handleAddStudent}
      />

      {/* Lines 90-100: Edit Student Modal
          Functionality: Update existing student profile information
          Triggers: Edit icon in student list row
          Success flow: saves data → calls handleSaveStudent → closes modal
          Note: Uses inline EditStudentModal wrapper for consistent modal chrome */}
      <EditStudentModal
        isOpen={modals.editStudent}
        student={selectedData.editingStudent}
        onClose={handlers.closeEditStudent}
        onSave={async (studentData) => {
          await handlers.handleSaveStudent(studentData);
          handlers.closeEditStudent();
        }}
      />

      {/* Lines 102-108: Payment Modal
          Functionality: Process membership payments and renewals
          Triggers: Payment icon in student list row
          Success flow: processes payment → calls onPaymentSuccess → updates membership → closes modal
          Features: Pricing tiers, payment methods, date selection, duplicate prevention */}
      <PaymentModal
        isOpen={modals.payment}
        onClose={handlers.closePayment}
        student={selectedData.paymentStudent}
        onPaymentSuccess={handlers.onPaymentSuccess}
      />

      {/* Lines 110-118: Training Session Modal
          Functionality: Record jiu-jitsu training sessions with attendance tracking
          Triggers: Training icon in student list row OR "Training Session" header button
          Success flow: records session → calls onTrainingSuccess → refreshes data → closes modal
          Features: Session type selection, attendance status, notes, date picker */}
      <TrainingSessionModal
        isOpen={modals.training}
        onClose={handlers.closeTraining}
        students={students}
        selectedStudent={selectedData.trainingStudent}
        onSuccess={handlers.onTrainingSuccess}
      />

      {/* Lines 120-125: SMS Credits Modal
          Functionality: Display Semaphore SMS balance and usage statistics
          Triggers: "Credits" button in dashboard header
          Features: Real-time balance, cost per SMS, usage stats, service health */}
      <SMSCreditsModal
        isOpen={modals.credits}
        onClose={handlers.closeCredits}
      />

      {/* Lines 127-132: SMS History Modal
          Functionality: View complete SMS reminder sending history
          Triggers: "History" button in dashboard header
          Features: Paginated history, status filters, cost tracking, student search */}
      <SMSHistoryModal
        isOpen={modals.history}
        onClose={handlers.closeHistory}
      />

      {/* Lines 134-147: Weekend Event Modal
          Functionality: Create weekend events with selective SMS notifications
          Triggers: "Weekend Event" button in dashboard header
          
          CRITICAL FIX: onEventCreated callback prevents "u is not a function" error
          - WeekendEventModal expects this callback at line 331
          - Without it: TypeError crashes the modal on form submission
          - With it: Successfully creates event, logs confirmation, closes modal
          
          Features:
          - Event type selection (NO_CLASSES, GENERAL, BANNER, SMS)
          - Selective recipient targeting (by status categories OR individual students)
          - SMS cost estimation before sending
          - Real-time SMS delivery via Semaphore API */}
      <WeekendEventModal
        isOpen={modals.weekendEvent}
        onClose={handlers.closeWeekendEvent}
        students={students}
        onEventCreated={(event) => {
          console.log("Weekend event created:", event);
          handlers.closeWeekendEvent();
        }}
      />

      {/* Lines 149-155: Monthly Report Modal
          Functionality: Generate and export monthly payment reports
          Triggers: "Monthly Report" button in dashboard header
          Features: Month/year selection, payment analytics, CSV export, revenue breakdown */}
      <MonthlyReportModal
        isOpen={modals.monthlyReport}
        onClose={handlers.closeMonthlyReport}
        students={students}
      />
    </>
  );
};

export default ModalContainer;