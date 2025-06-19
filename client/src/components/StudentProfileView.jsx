import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";


const StudentProfileView = ({ studentId, onBack, onEdit }) => {
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
      setError("Failed to load student data");
      console.error("Error fetching student:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatus = () => {
    if (!student?.memberships?.length) return "Inactive";

    const now = new Date();
    const active = student.memberships.find(
      (m) => new Date(m.endDate) > now && m.isActive
    );
    if (active) return "Active";

    const overdue = student.memberships.some((m) => {
      const days = (now - new Date(m.endDate)) / (1000 * 60 * 60 * 24);
      return days > 0 && days <= 30;
    });
    return overdue ? "Overdue" : "Inactive";
  };

  const formatDate = (d) => new Date(d).toLocaleDateString();
  const formatCurrency = (a) => `₱${a.toFixed(2)}`;
  const totalPaid =
    student?.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const currentMembership = student?.memberships?.find((m) => m.isActive);

  const handleBack = () => {
    if (onBack) {
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
    );
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
    );
  }

  if (!student) {
    return (
      <div className="p-4 max-w-4xl mx-auto text-sm text-gray-800">
        <div className="text-center text-gray-600">Student not found</div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto text-sm text-gray-800">
      {/* Back to  Dashboard */}
      <button
        onClick={handleBack}
        className="mb-4 text-blue-600 hover:text-blue-600 flex items-center"
      >
        ← Back to Dashboard
      </button>

      {/* Student Name Heading */}
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{student.name}</h1>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-gray-500">{student.email}</p>
          <p className="text-gray-400">Status: {getStatus()}</p>
        </div>
        <div className="space-x-2">
          <button className="text-sm bg-green-500 text-white px-3 py-1 rounded">
            Process Payment
          </button>
          <button 
            onClick={onEdit}
          className="text-sm bg-green-500 text-white px-3 py-1 rounded">
            Edit
          </button>
        </div>
      </div>
      {/* Tabs */}
      <div className="flex space-x-4 border-b mb-4">
        {["overview", "payments", "memberships"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-1 ${
              tab === t
                ? "border-b-2 border-blue-500 font-medium"
                : "text-gray-400"
            }`}
          >
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "overview" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-medium mb-1">Contact Info</p>
            <div>Email: {student.email}</div>
            <div>Phone: {student.phone || "N/A"}</div>
            <div>
              Joined: {formatDate(student.user?.createdAt || student.createdAt)}
            </div>
            <div>Student ID: {student.id}</div>
          </div>
          <div>
            <p className="font-medium mb-1">Current Membership</p>
            {currentMembership ? (
              <>
                <div>Type: {currentMembership.type}</div>
                <div>Started: {formatDate(currentMembership.startDate)}</div>
                <div>Ends: {formatDate(currentMembership.endDate)}</div>
                <div>
                  Type: {currentMembership.isActive ? "Acitve" : "Inacive"}
                </div>
              </>
            ) : (
              <div>No active membership</div>
            )}
          </div>
        </div>
      )}

      {tab === "payments" && (
        <table className="w-full text-left mt-4">
          <thead>
            <tr className="text-xs text-gray-500 border-b">
              <th className="py-2">Date</th>
              <th className="py-2">Amount</th>
              <th className="py-2">Method</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {student.payments?.length > 0 ? (
              student.payments.map((p) => (
                <tr key={p.id} className="border-b">
                  <td className="py-2">{formatDate(p.paidAt)}</td>
                  <td className="py-2">{formatCurrency(p.amount)}</td>
                  <td className="py-2">{p.method}</td>
                  <td className="py-2">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        p.status === "COMPLETED"
                          ? "bg-green-100 text-green-800"
                          : p.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center text-gray-500 py-4">
                  No payments found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {tab === "memberships" && (
        <div className="mt-4 space-y-2">
          {student.memberships?.length > 0 ? (
            student.memberships.map((m) => (
              <div key={m.id} className="border p-3 rounded">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{m.type}</div>
                    <div className="text-sm text-gray-600">
                      {formatDate(m.startDate)} - {formatDate(m.endDate)}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      m.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {m.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-4">
              No memberships found
            </div>
          )}
        </div>
      )}
      {/* Summary */}
      <div className="mt-8 p-4 bg-gray-50 rounded text-sm text-gray-700">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-medium">Payment Summary</p>
            <p>Total Paid: {formatCurrency(totalPaid)}</p>
            <p>Payment Records: {student.payments?.length || 0}</p>
            <p></p>
          </div>
          <div>
            <p className="font-medium">Membership Summary</p>
            <p>Total Memberships: {student.memberships?.length || 0}</p>
            <p>Current Status: {getStatus()}</p>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfileView;
