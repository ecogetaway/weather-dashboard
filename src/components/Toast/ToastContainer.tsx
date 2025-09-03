import React from 'react';
import { createPortal } from 'react-dom';
import Toast, { ToastProps } from './Toast';
import styles from './ToastContainer.module.css';

export interface ToastContainerProps {
  toasts: ToastProps[];
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  maxToasts?: number;
}

/**
 * ToastContainer component for managing and displaying multiple toasts
 * Uses React Portal to render toasts at the document level
 */
const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  position = 'top-right',
  maxToasts = 5
}) => {
  // Limit the number of visible toasts
  const visibleToasts = toasts.slice(0, maxToasts);

  const containerClasses = [
    styles.container,
    styles[position.replace('-', '')]
  ].join(' ');

  const toastElements = (
    <div className={containerClasses} role="region" aria-label="Notifications">
      {visibleToasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  );

  // Render toasts in a portal to ensure they appear above all other content
  return typeof document !== 'undefined'
    ? createPortal(toastElements, document.body)
    : null;
};

export default ToastContainer;