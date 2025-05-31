import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const MembershipPage = () => {
  const { token, user, logout } = useAuth();
  const [membership, setMembership] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMembership = async () => {
      if (!token || !user) return;

      try {
        const res = await axios.get("/api/memberships/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMembership(res.data);
        setError(null);
        console.log("Membership fetched:", res.data);
      } catch (err) {
        console.error("Failed to load membership:", err.response?.status, err.message);
        setError("Failed to load membership");
        if (err.response?.status === 401) {
          console.log("Unauthorized, logging out");
          logout();
        }
      }
    };

    fetchMembership();
  }, [token, user, logout]);

  if (!token || !user) return <div>Not logged in</div>;
  if (error) return <div>{error}</div>;
  if (!membership) return <div>Loading membership info...</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Your Membership</h2>
      <p>
        <strong>Status:</strong>{" "}
        {new Date(membership.endDate) > new Date() ? "Active" : "Expired"}
      </p>
      <p>
        <strong>Start Date:</strong>{" "}
        {new Date(membership.startDate).toLocaleDateString()}
      </p>
      <p>
        <strong>End Date:</strong>{" "}
        {new Date(membership.endDate).toLocaleDateString()}
      </p>
    </div>
  );
};

export default MembershipPage;