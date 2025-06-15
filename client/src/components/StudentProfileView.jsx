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
        const days = (now = new Date(m.endDate)) / (1000 * 60 * 60 * 24);
        return days > 0 && days <= 30;
    });
    return overdue ? 'Overdue' : 'Inactive';
  };

  const formatDate = (d) => new Date(d).toLocaleDateString();
  const formatCurrency = (a) => `₱${a.toFixed(2)}`;
  const totalPaid = student?.payments?.reduce((sum, p) => sum + p.amount, 0) || 0; 
  const currentMembership = student?.memberships?.find(m => m.isActive);

  const handleBack = () => {
    if() {

    } else {
        
    }
  };

  if (loading) {
    return ()
  }

  if (error) {
    return ()
  }
};

export default StudentProfileView;
