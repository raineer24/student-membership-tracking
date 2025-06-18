import React, { useState } from "react";
import { Save, X } from "lucide-react";

const StudentEditForm = ({ student, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: student.name || "",
    email: student.email || "",
    phone: student.phone || "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validatePhoneNumber = (phone) => {
    if (!phone) return true;
    const cleanPhone = phone.replace(/[-\s]/g, "");
    const phoneRegex = /^(\+63|0)?[0-9]{10,11}$/;
    return phoneRegex.test(cleanPhone);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (formData.phone && !validatePhoneNumber(formData.phone)) {
      newErrors.phone = "Please enter a valid Philippine phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const updatedStudent = { ...student, ...formData };
      await onSave(updatedStudent);
    } catch (error) {
      console.error("Error updating student:", error);
      setErrors({ submit: "Failed to  update student. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: ''}));
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto text-sm text-gray-800">
        {/* Back to Profile */}
        <button
            onClick={onCancel}
            className="mb-4 text-blue-600 hover:text-blue-600 flex items-center"
        >
             ← Back to Profile
        </button>

        <div className="bg-white p-6 rounded border">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Edit Student Profile</h2>
                <button
                    onClick={onCancel}
                    className="text-gray-400 hover:text-gray-600"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            {errors.submit && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-800">{errors.submit}</p>
                </div>
            )}

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                    </label>
                    <input type="text" 
                        value={formData.name}
                        onChange={(e) => handleFieldChange('name', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors.name ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter student's full name"
                        disabled={loading}
                    />
                    {errors.email && (
                        <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                    )}
                </div>

                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                    </label>
                    <input type="text" 
                        value={formData.name}
                        onChange={(e) => handleFieldChange('name', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors.name ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter student's full name"
                        disabled={loading}
                    />
                    {errors.email && (
                        <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                    )}
                </div>


            </div>
        </div>
    </div>
  )
};
