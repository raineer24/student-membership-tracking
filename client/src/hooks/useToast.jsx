import React, { createContext, useContext, useState } from 'react';

// Create context
const ToastContext = createContext();

// Provider component
export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);

  const showSuccess = (message) => {
    console.log("showSuccess called with:", message);
    const newToast = { message, type: "success", id: Date.now() };
    console.log("Setting toast to:", newToast);
    setToast(newToast);
  };

  const showError = (message) => {
    console.log("showError called with:", message);
    const newToast = { message, type: "error", id: Date.now() };
    console.log("Setting toast to:", newToast);
    setToast(newToast);
  };

  const hideToast = () => {
    console.log("hideToast called");
    setToast(null);
  };

  console.log("ToastProvider - current toast state:", toast);

  return (
    <ToastContext.Provider value={{ toast, showSuccess, showError, hideToast }}>
      {children}
    </ToastContext.Provider>
  );
};

// Hook to use toast
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};