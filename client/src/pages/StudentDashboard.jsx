import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import DashboardHeader from "../components/student/DashboardHeader";
import MembershipCard from "../components/student/MembershipCard";
import PaymentHistory from "../components/student/PaymentHistory";
import QuickActions from "../components/student/QuickActions";
import { studentApi } from "../services/studentApi";

const StudentDashboard = () => {
  const { user, loading: authLoading, logout } = useAuth();
  const [data, setData] = useState({
    student: null,
    membership: null,
    payments: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Wait for auth to load and check if user is student
    if (!authLoading) {
        if(!user) {
            // Not authenticated, redirect to login
            window.location.href = '/login';
            return;
        }
        if(user.role !== 'STUDENT') {
            // Wrong role, redirect to appropriate dashboard
            const redirectUrl = user.role === 'ADMIN' ? '/admin' : '/login';
            window.location.href = redirectUrl;
            return;
        }
        //User is authenticated student,load dashboard data
    }
  }, [authLoading, user]);

  const initializeDashboard = async () => {
    try {
        
    } catch (error) {
        
    } finally {
        setLoading(false);
    }
  }
};

export default StudentDashboard;
