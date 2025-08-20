// File: client/src/hooks/useToast.jsx
// Lines 1-15: FIXED Toast System - Eliminates replace() undefined errors
import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

// Line 17-25: Toast Context Creation
const ToastContext = createContext();

// Line 27-35: Toast Types and Configuration
const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// Lines 37-70: FIXED TOAST CONFIG - Safe string handling
const TOAST_CONFIG = {
  [TOAST_TYPES.SUCCESS]: {
    duration: 3000,
    icon: '✅',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-800',
    hoverColor: 'hover:text-green-900',
    closeColor: 'text-green-500'
  },
  [TOAST_TYPES.ERROR]: {
    duration: 5000,
    icon: '❌',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-800',
    hoverColor: 'hover:text-red-900',
    closeColor: 'text-red-500'
  },
  [TOAST_TYPES.WARNING]: {
    duration: 4000,
    icon: '⚠️',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-800',
    hoverColor: 'hover:text-yellow-900',
    closeColor: 'text-yellow-500'
  },
  [TOAST_TYPES.INFO]: {
    duration: 3000,
    icon: 'ℹ️',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-800',
    hoverColor: 'hover:text-blue-900',
    closeColor: 'text-blue-500'
  }
};

// Lines 75-200: FIXED Toast Provider - Safe string operations
export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);
  const [toastQueue, setToastQueue] = useState([]);
  const timeoutRef = useRef(null);
  const isDisplayingRef = useRef(false);
  const processingRef = useRef(false);

  // Clear existing timeout utility
  const clearExistingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // FIXED Process toast queue - Safe processing
  const processQueue = useCallback(() => {
    if (processingRef.current || isDisplayingRef.current || toastQueue.length === 0) {
      return;
    }

    processingRef.current = true;

    const nextToast = toastQueue[0];
    
    // Remove from queue immediately
    setToastQueue(prev => prev.slice(1));
    
    // Show toast
    setToast(nextToast);
    isDisplayingRef.current = true;

    const config = TOAST_CONFIG[nextToast.type] || TOAST_CONFIG[TOAST_TYPES.INFO];
    
    // Set auto-hide timer
    timeoutRef.current = setTimeout(() => {
      setToast(null);
      isDisplayingRef.current = false;
      processingRef.current = false;
      
      // Schedule next processing
      setTimeout(() => {
        processingRef.current = false;
      }, 100);
      
    }, config.duration);

    processingRef.current = false;
  }, [toastQueue]);

  // Effect to process queue
  useEffect(() => {
    if (!processingRef.current && !isDisplayingRef.current && toastQueue.length > 0) {
      const timer = setTimeout(processQueue, 50);
      return () => clearTimeout(timer);
    }
  }, [toastQueue, processQueue]);

  // FIXED showSuccess - Safe string conversion
  const showSuccess = useCallback((message, options = {}) => {
    // CRITICAL FIX: Ensure message is always a string
    const safeMessage = message === null || message === undefined ? 
      'Success' : String(message);
    
    const newToast = {
      id: Date.now() + Math.random(),
      message: safeMessage,
      type: TOAST_TYPES.SUCCESS,
      persistent: options.persistent || false,
      action: options.action || null,
      ...options
    };

    setToastQueue(prev => [...prev, newToast]);
  }, []);

  // FIXED showError - Safe string conversion
  const showError = useCallback((message, options = {}) => {
    // CRITICAL FIX: Ensure message is always a string
    const safeMessage = message === null || message === undefined ? 
      'An error occurred' : String(message);
    
    const newToast = {
      id: Date.now() + Math.random(),
      message: safeMessage,
      type: TOAST_TYPES.ERROR,
      persistent: options.persistent || false,
      action: options.action || null,
      ...options
    };

    setToastQueue(prev => [...prev, newToast]);
  }, []);

  // FIXED showWarning - Safe string conversion
  const showWarning = useCallback((message, options = {}) => {
    // CRITICAL FIX: Ensure message is always a string
    const safeMessage = message === null || message === undefined ? 
      'Warning' : String(message);
    
    const newToast = {
      id: Date.now() + Math.random(),
      message: safeMessage,
      type: TOAST_TYPES.WARNING,
      persistent: options.persistent || false,
      action: options.action || null,
      ...options
    };

    setToastQueue(prev => [...prev, newToast]);
  }, []);

  // FIXED showInfo - Safe string conversion
  const showInfo = useCallback((message, options = {}) => {
    // CRITICAL FIX: Ensure message is always a string
    const safeMessage = message === null || message === undefined ? 
      'Information' : String(message);
    
    const newToast = {
      id: Date.now() + Math.random(),
      message: safeMessage,
      type: TOAST_TYPES.INFO,
      persistent: options.persistent || false,
      action: options.action || null,
      ...options
    };

    setToastQueue(prev => [...prev, newToast]);
  }, []);

  // Manual hide toast functionality
  const hideToast = useCallback(() => {
    clearExistingTimeout();
    setToast(null);
    isDisplayingRef.current = false;
    processingRef.current = false;
    
    setTimeout(() => {
      processingRef.current = false;
    }, 100);
  }, [clearExistingTimeout]);

  // Clear all toasts utility
  const clearAllToasts = useCallback(() => {
    clearExistingTimeout();
    setToast(null);
    setToastQueue([]);
    isDisplayingRef.current = false;
    processingRef.current = false;
  }, [clearExistingTimeout]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearExistingTimeout();
      processingRef.current = false;
      isDisplayingRef.current = false;
    };
  }, [clearExistingTimeout]);

  // Provider value - All stable functions
  const contextValue = {
    toast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideToast,
    clearAllToasts,
    queueLength: toastQueue.length
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
    </ToastContext.Provider>
  );
};

// Lines 205-225: Enhanced useToast hook with error handling
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Lines 230-350: FIXED SimpleToast Component - Safe CSS class handling
export const SimpleToast = ({ message, type, onClose, action, persistent = false }) => {
  // CRITICAL FIX: Safe config access with fallback
  const config = TOAST_CONFIG[type] || TOAST_CONFIG[TOAST_TYPES.INFO];
  
  // CRITICAL FIX: Ensure all config values exist with safe defaults
  const safeConfig = {
    icon: config.icon || 'ℹ️',
    bgColor: config.bgColor || 'bg-blue-50',
    borderColor: config.borderColor || 'border-blue-200',
    textColor: config.textColor || 'text-blue-800',
    hoverColor: config.hoverColor || 'hover:text-blue-900',
    closeColor: config.closeColor || 'text-blue-500',
    duration: config.duration || 3000
  };

  // Auto-hide logic
  useEffect(() => {
    if (persistent) return;

    const timer = setTimeout(() => {
      onClose();
    }, safeConfig.duration);

    return () => clearTimeout(timer);
  }, [persistent, safeConfig.duration, onClose]);

  // Enhanced toast animations
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300);
  }, [onClose]);

  // CRITICAL FIX: Ensure message is always a string
  const safeMessage = message === null || message === undefined ? 
    'Notification' : String(message);

  return (
    <div className={`
      fixed top-4 right-4 z-50 max-w-sm w-full
      transform transition-all duration-300 ease-in-out
      ${isVisible && !isExiting 
        ? 'translate-x-0 opacity-100' 
        : 'translate-x-full opacity-0'
      }
    `}>
      <div className={`
        rounded-lg shadow-lg border p-4 flex items-start justify-between
        ${safeConfig.bgColor} ${safeConfig.borderColor} ${safeConfig.textColor}
        backdrop-blur-sm bg-opacity-95
      `}>
        <div className="flex items-start space-x-3 flex-1">
          <span className="text-lg flex-shrink-0 mt-0.5">
            {safeConfig.icon}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium break-words">
              {safeMessage}
            </p>
            {action && (
              <button
                onClick={action.onClick}
                className={`
                  mt-2 text-xs font-medium underline
                  ${safeConfig.textColor} ${safeConfig.hoverColor}
                  transition-colors duration-200
                `}
              >
                {String(action.label || 'Action')}
              </button>
            )}
          </div>
        </div>
        
        {/* CRITICAL FIX: Safe CSS class handling - NO MORE .replace() calls */}
        <button
          onClick={handleClose}
          className={`
            ml-4 inline-flex text-sm p-1 rounded-md flex-shrink-0
            ${safeConfig.closeColor} ${safeConfig.hoverColor}
            transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
          `}
          aria-label="Close notification"
        >
          <span className="sr-only">Close</span>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// Lines 355-380: Toast Container Component
export const ToastContainer = () => {
  const { toast } = useToast();

  if (!toast) return null;

  return <SimpleToast {...toast} />;
};

// Lines 385-450: FIXED Utility Functions for Common Toast Patterns
export const useToastHelpers = () => {
  const { showSuccess, showError, showWarning, showInfo } = useToast();

  return {
    // Success patterns - All with safe string handling
    saveSuccess: useCallback((itemName = 'Item') => {
      const safeItemName = String(itemName || 'Item');
      showSuccess(`${safeItemName} saved successfully!`);
    }, [showSuccess]),
    
    deleteSuccess: useCallback((itemName = 'Item') => {
      const safeItemName = String(itemName || 'Item');
      showSuccess(`${safeItemName} deleted successfully!`);
    }, [showSuccess]),
    
    updateSuccess: useCallback((itemName = 'Item') => {
      const safeItemName = String(itemName || 'Item');
      showSuccess(`${safeItemName} updated successfully!`);
    }, [showSuccess]),

    // Error patterns - All with safe string handling
    saveError: useCallback((itemName = 'Item') => {
      const safeItemName = String(itemName || 'Item');
      showError(`Failed to save ${safeItemName.toLowerCase()}. Please try again.`);
    }, [showError]),
    
    deleteError: useCallback((itemName = 'Item') => {
      const safeItemName = String(itemName || 'Item');
      showError(`Failed to delete ${safeItemName.toLowerCase()}. Please try again.`);
    }, [showError]),
    
    networkError: useCallback(() => 
      showError('Network error. Please check your connection and try again.'), [showError]),

    // Warning patterns  
    unsavedChanges: useCallback(() => 
      showWarning('You have unsaved changes. Please save before leaving.'), [showWarning]),

    // Info patterns
    loading: useCallback((message = 'Processing...') => {
      const safeMessage = String(message || 'Processing...');
      showInfo(safeMessage);
    }, [showInfo])
  };
};

// Lines 455-485: FIXED Hook for Toast Notifications with Actions
export const useActionToast = () => {
  const { showSuccess, showError } = useToast();

  const showUndoToast = useCallback((message, undoAction) => {
    const safeMessage = String(message || 'Action completed');
    showSuccess(safeMessage, {
      action: {
        label: 'Undo',
        onClick: undoAction
      },
      persistent: true
    });
  }, [showSuccess]);

  const showRetryToast = useCallback((message, retryAction) => {
    const safeMessage = String(message || 'Action failed');
    showError(safeMessage, {
      action: {
        label: 'Retry',
        onClick: retryAction
      }
    });
  }, [showError]);

  return { showUndoToast, showRetryToast };
};

// Lines 490-500: Export all components and utilities
export default {
  ToastProvider,
  useToast,
  useToastHelpers,
  useActionToast,
  SimpleToast,
  ToastContainer,
  TOAST_TYPES
};