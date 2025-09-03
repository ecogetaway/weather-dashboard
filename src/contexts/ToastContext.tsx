import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ToastProps, ToastType } from '../components/Toast/Toast';
import ToastContainer from '../components/Toast/ToastContainer';

interface ToastContextType {
  showToast: (toast: Omit<ToastProps, 'id' | 'onClose'>) => string;
  hideToast: (id: string) => void;
  clearAllToasts: () => void;
  toasts: ToastProps[];
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  maxToasts?: number;
}

/**
 * ToastProvider component that manages toast state and provides toast functions
 */
export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  position = 'top-right',
  maxToasts = 5
}) => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const showToast = useCallback((toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newToast: ToastProps = {
      ...toast,
      id,
      onClose: (toastId: string) => {
        setToasts(prev => prev.filter(t => t.id !== toastId));
      }
    };

    setToasts(prev => [newToast, ...prev]);
    return id;
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const contextValue: ToastContextType = {
    showToast,
    hideToast,
    clearAllToasts,
    toasts
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer 
        toasts={toasts} 
        position={position} 
        maxToasts={maxToasts} 
      />
    </ToastContext.Provider>
  );
};

/**
 * Hook to access toast functionality
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

/**
 * Convenience hook with pre-configured toast methods
 */
export const useToastHelpers = () => {
  const { showToast } = useToast();

  const showSuccess = useCallback((title: string, message?: string, options?: Partial<ToastProps>) => {
    return showToast({
      type: 'success',
      title,
      message,
      duration: 4000,
      ...options
    });
  }, [showToast]);

  const showError = useCallback((title: string, message?: string, options?: Partial<ToastProps>) => {
    return showToast({
      type: 'error',
      title,
      message,
      duration: 6000,
      ...options
    });
  }, [showToast]);

  const showWarning = useCallback((title: string, message?: string, options?: Partial<ToastProps>) => {
    return showToast({
      type: 'warning',
      title,
      message,
      duration: 5000,
      ...options
    });
  }, [showToast]);

  const showInfo = useCallback((title: string, message?: string, options?: Partial<ToastProps>) => {
    return showToast({
      type: 'info',
      title,
      message,
      duration: 4000,
      ...options
    });
  }, [showToast]);

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showToast
  };
};

export default ToastContext;