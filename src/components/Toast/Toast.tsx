import React, { useEffect, useState } from 'react';
import styles from './Toast.module.css';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Toast component for displaying notifications
 * Features auto-dismiss, manual close, and action buttons
 */
const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose,
  action
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(id);
    }, 300); // Match CSS animation duration
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return 'ℹ️';
    }
  };

  const toastClasses = [
    styles.toast,
    styles[type],
    isVisible ? styles.visible : '',
    isExiting ? styles.exiting : ''
  ].filter(Boolean).join(' ');

  return (
    <div
      className={toastClasses}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className={styles.content}>
        <div className={styles.icon} aria-hidden="true">
          {getIcon()}
        </div>
        
        <div className={styles.text}>
          <div className={styles.title}>{title}</div>
          {message && <div className={styles.message}>{message}</div>}
        </div>

        <div className={styles.actions}>
          {action && (
            <button
              onClick={action.onClick}
              className={styles.actionButton}
              aria-label={action.label}
            >
              {action.label}
            </button>
          )}
          
          <button
            onClick={handleClose}
            className={styles.closeButton}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      </div>

      {duration > 0 && (
        <div 
          className={styles.progressBar}
          style={{ 
            animationDuration: `${duration}ms`,
            animationPlayState: isExiting ? 'paused' : 'running'
          }}
        />
      )}
    </div>
  );
};

export default Toast;