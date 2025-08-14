// client/src/components/LogoutButton.jsx
// Lines 1-6: Imports and dependencies
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Lines 7-33: Main LogoutButton component
// Purpose: Simple logout functionality with consistent styling
// Used in: DashboardPage header for user logout
const LogoutButton = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Lines 7-15: Handle logout functionality
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Force navigation even if logout fails
      navigate('/login');
    }
  };

  // Lines 16-33: Main component render
  return (
    <button
      onClick={handleLogout}
      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
      title="Logout from dashboard"
    >
      <span>🚪</span>
      <span>Logout</span>
    </button>
  );
};

export default LogoutButton;