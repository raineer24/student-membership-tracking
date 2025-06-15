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

  const getStatus = () => {};
};

export default StudentProfileView;
