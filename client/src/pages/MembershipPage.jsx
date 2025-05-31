// client/src/pages/MembershipPage.jsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const MembershipPage = () => {
  const { token } = useAuth(); // ✅ Use custom hook
  const [membership, setMembership] = useState(null);

  useEffect(() => {
    const fetchMembership = async () => {
      if (!token) return;

      try {
        const res = await axios.get("/api/memberships/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMembership(res.data);
      } catch (err) {
        console.error("Failed to load membership:", err);
      }
    };

    fetchMembership();
  }, [token]);

  if (!token) return <div>Not logged in</div>;
  if (!membership) return <div>Loading membership info...</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Your Membership</h2>
      <p><strong>Status:</strong> {new Date(membership.endDate) > new Date() ? "Active" : "Expired"}</p>
      <p><strong>Start Date:</strong> {new Date(membership.startDate).toLocaleDateString()}</p>
      <p><strong>End Date:</strong> {new Date(membership.endDate).toLocaleDateString()}</p>
    </div>
  );
};

export default MembershipPage;