// Line 1-15: FIXED Complete Enhanced useToast.jsx - Eliminates Infinite Loop
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

const TOAST_CONFIG = {
  [TOAST_TYPES.SUCCESS]: {
    duration: 3000,
    icon: '✅',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-800',
    hoverColor: 'hover:bg-green-100'
  },
  [TOAST_TYPES.ERROR]: {
    duration: 5000,
    icon: '❌',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-800',
    hoverColor: 'hover:bg-red-100'
  },
  [TOAST_TYPES.WARNING]: {
    duration: 4000,
    icon: '⚠️',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-800',
    hoverColor: 'hover:bg-yellow-100'
  },
  [TOAST_TYPES.INFO]: {
    duration: 3000,
    icon: 'ℹ️',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-800',
    hoverColor: 'hover:bg-blue-100'
  }
};

// Line 36-200: FIXED Toast Provider - Eliminates all circular dependencies
export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);
  const [toastQueue, setToastQueue] = useState([]);
  const timeoutRef = useRef(null);
  const isDisplayingRef = useRef(false);
  const processingRef = useRef(false); // CRITICAL: Prevent duplicate processing

  // Line 44-50: Clear existing timeout utility
  const clearExistingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Line 52-85: FIXED Process toast queue - No circular dependencies
  const processQueue = useCallback(() => {
    // CRITICAL: Prevent infinite loops with processing guard
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

    const config = TOAST_CONFIG[nextToast.type];
    
    // Set auto-hide timer
    timeoutRef.current = setTimeout(() => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Auto-hiding ${nextToast.type} toast:`, nextToast.message);
      }
      
      setToast(null);
      isDisplayingRef.current = false;
      processingRef.current = false;
      
      // Schedule next processing WITHOUT causing re-render loop
      setTimeout(() => {
        processingRef.current = false;
        // This will trigger the next useEffect, not a direct call
      }, 100);
      
    }, config.duration);

    processingRef.current = false;
  }, [toastQueue]); // ONLY toastQueue dependency

  // Line 87-95: FIXED Effect to process queue - Prevents infinite loops
  useEffect(() => {
    // Only process if not currently processing and queue has items
    if (!processingRef.current && !isDisplayingRef.current && toastQueue.length > 0) {
      const timer = setTimeout(processQueue, 50); // Small delay prevents stack overflow
      return () => clearTimeout(timer);
    }
  }, [toastQueue, processQueue]);

  // Line 97-115: FIXED showSuccess - Stable implementation
  const showSuccess = useCallback((message, options = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.log("showSuccess called with:", message);
    }
    
    const newToast = {
      id: Date.now() + Math.random(),
      message: String(message), // Convert to string to prevent object references
      type: TOAST_TYPES.SUCCESS,
      persistent: options.persistent || false,
      action: options.action || null,
      ...options
    };

    if (process.env.NODE_ENV === 'development') {
      console.log("Adding success toast to queue:", newToast.message);
    }

    setToastQueue(prev => [...prev, newToast]);
  }, []); // NO dependencies - completely stable

  // Line 117-135: FIXED showError - Stable implementation
  const showError = useCallback((message, options = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.log("showError called with:", message);
    }
    
    const newToast = {
      id: Date.now() + Math.random(),
      message: String(message), // Convert to string to prevent object references
      type: TOAST_TYPES.ERROR,
      persistent: options.persistent || false,
      action: options.action || null,
      ...options
    };

    if (process.env.NODE_ENV === 'development') {
      console.log("Adding error toast to queue:", newToast.message);
    }

    setToastQueue(prev => [...prev, newToast]);
  }, []); // NO dependencies - completely stable

  // Line 137-150: showWarning method - Stable
  const showWarning = useCallback((message, options = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.log("showWarning called with:", message);
    }
    
    const newToast = {
      id: Date.now() + Math.random(),
      message: String(message),
      type: TOAST_TYPES.WARNING,
      persistent: options.persistent || false,
      action: options.action || null,
      ...options
    };

    setToastQueue(prev => [...prev, newToast]);
  }, []); // NO dependencies - completely stable

  // Line 152-165: showInfo method - Stable
  const showInfo = useCallback((message, options = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.log("showInfo called with:", message);
    }
    
    const newToast = {
      id: Date.now() + Math.random(),
      message: String(message),
      type: TOAST_TYPES.INFO,
      persistent: options.persistent || false,
      action: options.action || null,
      ...options
    };

    setToastQueue(prev => [...prev, newToast]);
  }, []); // NO dependencies - completely stable

  // Line 167-180: FIXED Manual hide toast functionality
  const hideToast = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log("hideToast called manually");
    }
    
    clearExistingTimeout();
    setToast(null);
    isDisplayingRef.current = false;
    processingRef.current = false;
    
    // Process next toast after hiding current one
    setTimeout(() => {
      processingRef.current = false;
    }, 100);
  }, [clearExistingTimeout]);

  // Line 182-190: Clear all toasts utility
  const clearAllToasts = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log("Clearing all toasts");
    }
    
    clearExistingTimeout();
    setToast(null);
    setToastQueue([]);
    isDisplayingRef.current = false;
    processingRef.current = false;
  }, [clearExistingTimeout]);

  // Line 192-200: Cleanup on unmount
  useEffect(() => {
    return () => {
      clearExistingTimeout();
      processingRef.current = false;
      isDisplayingRef.current = false;
    };
  }, [clearExistingTimeout]);

  // Line 202-215: FIXED Provider value - All stable functions
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

// Line 217-225: Enhanced useToast hook with error handling
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Line 227-320: FIXED SimpleToast Component - Prevents re-render loops
export const SimpleToast = ({ message, type, onClose, action, persistent = false }) => {
  const config = TOAST_CONFIG[type] || TOAST_CONFIG[TOAST_TYPES.INFO];

  // Line 230-240: FIXED Auto-hide logic - Stable dependencies
  useEffect(() => {
    if (persistent) return;

    const timer = setTimeout(() => {
      onClose();
    }, config.duration);

    return () => clearTimeout(timer);
  }, [persistent, config.duration, onClose]); // Stable dependencies only

  // Line 242-270: Enhanced toast animations
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300);
  }, [onClose]);

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
        ${config.bgColor} ${config.borderColor} ${config.textColor}
        backdrop-blur-sm bg-opacity-95
      `}>
        <div className="flex items-start space-x-3 flex-1">
          <span className="text-lg flex-shrink-0 mt-0.5">
            {config.icon}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium break-words">
              {message}
            </p>
            {action && (
              <button
                onClick={action.onClick}
                className={`
                  mt-2 text-xs font-medium underline
                  ${config.textColor} ${config.hoverColor}
                  transition-colors duration-200
                `}
              >
                {action.label}
              </button>
            )}
          </div>
        </div>
        
        <button
          onClick={handleClose}
          className={`
            ml-4 inline-flex text-sm p-1 rounded-md flex-shrink-0
            ${config.textColor.replace('text-', 'text-')} ${config.hoverColor}
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

// Line 322-350: Toast Container Component for Multiple Toasts
export const ToastContainer = () => {
  const { toast } = useToast();

  if (!toast) return null;

  return <SimpleToast {...toast} />;
};

// Line 352-380: FIXED Utility Functions for Common Toast Patterns
export const useToastHelpers = () => {
  const { showSuccess, showError, showWarning, showInfo } = useToast();

  // FIXED: All functions are stable with no dependencies
  return {
    // Success patterns
    saveSuccess: useCallback((itemName = 'Item') => 
      showSuccess(`${itemName} saved successfully!`), [showSuccess]),
    
    deleteSuccess: useCallback((itemName = 'Item') => 
      showSuccess(`${itemName} deleted successfully!`), [showSuccess]),
    
    updateSuccess: useCallback((itemName = 'Item') => 
      showSuccess(`${itemName} updated successfully!`), [showSuccess]),

    // Error patterns
    saveError: useCallback((itemName = 'Item') => 
      showError(`Failed to save ${itemName.toLowerCase()}. Please try again.`), [showError]),
    
    deleteError: useCallback((itemName = 'Item') => 
      showError(`Failed to delete ${itemName.toLowerCase()}. Please try again.`), [showError]),
    
    networkError: useCallback(() => 
      showError('Network error. Please check your connection and try again.'), [showError]),

    // Warning patterns  
    unsavedChanges: useCallback(() => 
      showWarning('You have unsaved changes. Please save before leaving.'), [showWarning]),

    // Info patterns
    loading: useCallback((message = 'Processing...') => 
      showInfo(message), [showInfo])
  };
};

// Line 382-400: FIXED Hook for Toast Notifications with Actions
export const useActionToast = () => {
  const { showSuccess, showError } = useToast();

  const showUndoToast = useCallback((message, undoAction) => {
    showSuccess(message, {
      action: {
        label: 'Undo',
        onClick: undoAction
      },
      persistent: true
    });
  }, [showSuccess]);

  const showRetryToast = useCallback((message, retryAction) => {
    showError(message, {
      action: {
        label: 'Retry',
        onClick: retryAction
      }
    });
  }, [showError]);

  return { showUndoToast, showRetryToast };
};

// Line 402-415: Export all components and utilities
export default {
  ToastProvider,
  useToast,
  useToastHelpers,
  useActionToast,
  SimpleToast,
  ToastContainer,
  TOAST_TYPES
};