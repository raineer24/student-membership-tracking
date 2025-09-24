// File: client/src/components/profile/BasicInformation.jsx
// Lines 1-60: Basic information section extracted from StudentProfileView

import React from 'react';
import { calculateAge } from '../../utils/profileCalculations';

const BasicInformation = ({ studentData }) => {
  return (
    <div className="bg-gray-800 rounded-xl border border-gray-600 shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-6 py-4 border-b border-gray-600">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <span className="mr-2">👤</span>
          Basic Information
        </h3>
      </div>
      <div className="p-6 space-y-4">
        <div className="space-y-4">
          <div className="flex justify-between items-center py-2 border-b border-gray-700">
            <label className="text-sm font-medium text-gray-400">Name</label>
            <p className="text-sm font-medium text-white text-right">{studentData.name || "N/A"}</p>
          </div>
          
          <div className="flex justify-between items-center py-2 border-b border-gray-700">
            <label className="text-sm font-medium text-gray-400">Age</label>
            <p className="text-sm text-white text-right">
              {studentData.age || (studentData.birthDate ? `${calculateAge(studentData.birthDate)} years` : "N/A")}
            </p>
          </div>
          
          <div className="flex justify-between items-center py-2 border-b border-gray-700">
            <label className="text-sm font-medium text-gray-400">Parent/Guardian</label>
            <p className="text-sm text-white text-right max-w-[150px] truncate">
              {studentData.parentName || studentData.parent || "N/A"}
            </p>
          </div>
          
          <div className="flex justify-between items-center py-2 border-b border-gray-700">
            <label className="text-sm font-medium text-gray-400">Email</label>
            <p className="text-sm text-white text-right truncate max-w-[150px]">{studentData.email || "N/A"}</p>
          </div>
          
          <div className="flex justify-between items-center py-2 border-b border-gray-700">
            <label className="text-sm font-medium text-gray-400">Phone</label>
            <p className="text-sm text-white text-right">{studentData.phone || "N/A"}</p>
          </div>
          
          <div className="flex justify-between items-center py-2 border-b border-gray-700">
            <label className="text-sm font-medium text-gray-400">Student ID</label>
            <p className="text-sm font-mono text-white">#{studentData.id}</p>
          </div>
          
          <div className="flex justify-between items-center py-2">
            <label className="text-sm font-medium text-gray-400">Monthly Rate</label>
            <p className="text-lg font-bold text-white">₱{(studentData.monthlyRate || 1400).toLocaleString()}/mo</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicInformation;