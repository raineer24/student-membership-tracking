// File: client/src/components/dashboard/ModalContainer.jsx
// Lines 1-120: Centralized modal rendering container
// Clear line guidance: Extract all modal rendering logic for better organization

import React from "react";
import AddStudentModal from "../AddStudentModal";
import PaymentModal from "../PaymentModal";
import TrainingSessionModal from "../training/TrainingSessionModal";
import SMSCreditsModal from "../modals/SMSCreditsModal";
import SMSHistoryModal from "../modals/SMSHistoryModal";
import WeekendEventModal from "../modals/WeekendEventModal";
import MonthlyReportModal from "../modals/MonthlyReportModal";
import StudentEditForm from "../StudentEditForm";

// Lines 12-30: Edit Student Modal Component (inline modal wrapper)
const EditStudentModal = ({ isOpen, student, onClose, onSave }) => {
  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl border border-gray-600 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">
            Edit Student Profile
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl focus:outline-none focus:ring-2 focus:ring-gray-500"
            title="Close"
          >
            ✕
          </button>
        </div>
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
 * Centralized modal container component
 * Follows Single Responsibility Principle - handles only modal rendering
 * Preserves ALL existing modal functionality from DashboardPage
 * @param {Object} modals - Modal state object from useModalManager
 * @param {Object} selectedData - Selected data for modals
 * @param {Object} handlers - Modal action handlers
 * @param {Array} students - Students data for modals that need it
 */
const ModalContainer = ({ modals, selectedData, handlers, students }) => {
  return (
    <>
      {/* Lines 55-60: Add Student Modal */}
      <AddStudentModal
        isOpen={modals.addStudent}
        onClose={handlers.closeAddStudent}
        onStudentAdded={handlers.handleAddStudent}
      />

      {/* Lines 62-67: Edit Student Modal */}
      <EditStudentModal
        isOpen={modals.editStudent}
        student={selectedData.editingStudent}
        onClose={handlers.closeEditStudent}
        onSave={async (studentData) => {
          await handlers.handleSaveStudent(studentData);
          handlers.closeEditStudent();
        }}
      />

      {/* Lines 69-75: Payment Modal */}
      <PaymentModal
        isOpen={modals.payment}
        onClose={handlers.closePayment}
        student={selectedData.paymentStudent}
        onPaymentSuccess={handlers.onPaymentSuccess}
      />

      {/* Lines 77-84: Training Session Modal */}
      <TrainingSessionModal
        isOpen={modals.training}
        onClose={handlers.closeTraining}
        students={students}
        selectedStudent={selectedData.trainingStudent}
        onSuccess={handlers.onTrainingSuccess}
      />

      {/* Lines 86-90: SMS Credits Modal */}
      <SMSCreditsModal
        isOpen={modals.credits}
        onClose={handlers.closeCredits}
      />

      {/* Lines 92-96: SMS History Modal */}
      <SMSHistoryModal
        isOpen={modals.history}
        onClose={handlers.closeHistory}
      />

      {/* Lines 98-103: Weekend Event Modal */}
      <WeekendEventModal
        isOpen={modals.weekendEvent}
        onClose={handlers.closeWeekendEvent}
        students={students}
      />

      {/* Lines 105-110: Monthly Report Modal */}
      <MonthlyReportModal
        isOpen={modals.monthlyReport}
        onClose={handlers.closeMonthlyReport}
        students={students}
      />
    </>
  );
};

export default ModalContainer;
