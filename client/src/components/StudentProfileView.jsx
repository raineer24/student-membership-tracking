import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const StudentProfileView = ({ studentId, onBack }) => {
  const [tab, setTab] = useState("overview");
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    if (studentId) {
      fetchStudentData();
    }
  }, [studentId, token]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Admin API call to get specific student
      const response = await fetch(`/api/students/${studentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch student: ${response.status}`);
      }

      const studentData = await response.json();
      setStudent(studentData);
    } catch (error) {
        setError('Failed to load student data');
        console.error('Error fetching student:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatus = () => {
    if (!student?.memberships?.length) return 'Inactive';

    const now = new Date();
    const active = student.memberships.find(m => new Date(m.endDate) > now && m.isActive);
    if (active) return 'Active';

    const overdue = student.memberships.some(m => {
        const days = (now - new Date(m.endDate)) / (1000 * 60 * 60 * 24);
        return days > 0 && days <= 30;
    });
    return overdue ? 'Overdue' : 'Inactive';
  };

  const formatDate = (d) => new Date(d).toLocaleDateString();
  const formatCurrency = (a) => `₱${a.toFixed(2)}`;
  const totalPaid = student?.payments?.reduce((sum, p) => sum + p.amount, 0) || 0; 
  const currentMembership = student?.memberships?.find(m => m.isActive);

  const handleBack = () => {
    if(onBack) {
        onBack();
    } else {
        // Default back navigation
        window.history.back();
    }
  };

  if (loading) {
    return (
        <div className="p-4 max-w-4xl mx-auto text-sm text-gray-800">
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 max-w-4xl mx-auto text-sm text-gray-800">
        <div className="text-center text-red-600 bg-red-50 p-4 rounded">
          {error}
          <button
            onClick={fetchStudentData}
            className="ml-4 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="p-4 max-w-4xl mx-auto text-sm text-gray-800">
        <div className="text-center text-gray-600">
          Student not found
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-4xl mx-auto text-sm text-gray-800">
        {/* Back to  Dashboard */ }
        <button 
          onClick={handleBack}
          className="mb-4 text-blue-600 hover:text-blue-600 flex items-center"
        >
          ← Back to Dashboard
        </button>

         {/* Student Name Heading */ }
         <h1 className="text-2xl font-bold text-gray-900 mb-6">{student.name}</h1>
         
          {/* Header */ }
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-gray-500">{student.email}</p>
              <p className="text-gray-400">Status: {getStatus()}</p>
            </div>
            <div className="space-x-2">
                <button className="text-sm bg-green-500 text-white px-3 py-1 rounded">Process Payment</button>
                <button className="text-sm bg-green-500 text-white px-3 py-1 rounded">Edit</button>
            </div>
          </div>
           {/* Tabs */ }
            {/* Tab Content */ }
             {/* Summary */ }
    </div>
  )
};

export default StudentProfileView;
