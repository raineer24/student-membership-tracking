// File: client/src/components/dashboard/TrainingSessionButton.jsx  
// Lines 455-500: Training Session Button for Student Cards
import React, { useState } from "react";
import TrainingSessionModal from "../training/TrainingSessionModal";

const TrainingSessionButton = ({ student, students, onSuccess }) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex flex-col items-center justify-center py-3 px-2 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white text-xs font-medium rounded-lg transition-all duration-200 min-h-[52px] transform active:scale-95"
        title={`Log training session for ${student.name}`}
      >
        <span className="text-lg mb-1">🥋</span>
        <span>Log Training</span>
      </button>

      <TrainingSessionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        students={students}
        selectedStudent={student}
        onSuccess={onSuccess}
      />
    </>
  );
};

export default TrainingSessionButton;