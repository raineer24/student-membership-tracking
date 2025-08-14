// File: client/src/components/LogoutButton.jsx
// Lines 1-30: Simple logout button component with enhanced styling
import React from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * LogoutButton Component
 * Provides logout functionality with consistent styling
 */
const LogoutButton = () => {
  // Lines 10-12: Auth context and logout handler
  const { logout } = useAuth();
  
  const handleLogout = () => {
    try {
      logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Lines 20-30: JSX return with enhanced logout button
  return (
    <button
      onClick={handleLogout}
      className="flex items-center px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
      title="Logout from Dashboard"
    >
      <svg 
        className="h-5 w-5 mr-2" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M17 16l4-4m0 0l-4-4m4 4H7m6 2v2a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2h6a2 2 0 012 2v2" 
        />
      </svg>
      Logout
    </button>
  );
};

export default LogoutButton;