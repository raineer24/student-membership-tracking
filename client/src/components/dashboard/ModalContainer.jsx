// File: client/src/components/dashboard/ModalContainer.jsx
import React from "react";
import AddStudentModal from "../AddStudentModal";
import PaymentModal from "../PaymentModal";
import TrainingSessionModal from "../training/TrainingSessionModal";
import BulkAttendanceModal from "../training/BulkAttendanceModal";
import SMSCreditsModal from "../modals/SMSCreditsModal";
import SMSHistoryModal from "../modals/SMSHistoryModal";
import WeekendEventModal from "../modals/WeekendEventModal";
import MonthlyReportModal from "../modals/MonthlyReportModal";
import StudentEditForm from "../StudentEditForm";

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
            aria-label="Close modal"
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

const ModalContainer = ({ modals, selectedData, handlers, students }) => {
  return (
    <>
      <AddStudentModal
        isOpen={modals.addStudent}
        onClose={handlers.closeAddStudent}
        onStudentAdded={handlers.handleAddStudent}
      />

      <EditStudentModal
        isOpen={modals.editStudent}
        student={selectedData.editingStudent}
        onClose={handlers.closeEditStudent}
        onSave={async (studentData) => {
          await handlers.handleSaveStudent(studentData);
          handlers.closeEditStudent();
        }}
      />

      <PaymentModal
        isOpen={modals.payment}
        onClose={handlers.closePayment}
        student={selectedData.paymentStudent}
        onPaymentSuccess={handlers.onPaymentSuccess}
      />

      <TrainingSessionModal
        isOpen={modals.training}
        onClose={handlers.closeTraining}
        students={students}
        selectedStudent={selectedData.trainingStudent}
        onSuccess={handlers.onTrainingSuccess}
      />

      <BulkAttendanceModal
        isOpen={modals.bulkAttendance}
        onClose={handlers.closeBulkAttendance}
        students={students}
        onSuccess={handlers.onTrainingSuccess}
      />

      <SMSCreditsModal
        isOpen={modals.credits}
        onClose={handlers.closeCredits}
      />

      <SMSHistoryModal
        isOpen={modals.history}
        onClose={handlers.closeHistory}
      />

      <WeekendEventModal
        isOpen={modals.weekendEvent}
        onClose={handlers.closeWeekendEvent}
        students={students}
        onEventCreated={(event) => {
          console.log("Weekend event created:", event);
          handlers.closeWeekendEvent();
        }}
      />

      <MonthlyReportModal
        isOpen={modals.monthlyReport}
        onClose={handlers.closeMonthlyReport}
        students={students}
      />
    </>
  );
};

export default ModalContainer;