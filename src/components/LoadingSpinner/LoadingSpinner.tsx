import React from 'react';
import styles from './LoadingSpinner.module.css';

export interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  className?: string;
  'aria-label'?: string;
}

/**
 * LoadingSpinner component with accessibility features and responsive sizing
 * Supports different sizes for various contexts and follows mobile-first design
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color,
  className = '',
  'aria-label': ariaLabel = 'Loading...'
}) => {
  const spinnerClasses = [
    styles.spinner,
    styles[size],
    className
  ].filter(Boolean).join(' ');

  const spinnerStyle = color ? { borderTopColor: color } : undefined;

  return (
    <div className={styles.container}>
      <div
        className={spinnerClasses}
        style={spinnerStyle}
        role="status"
        aria-label={ariaLabel}
        aria-live="polite"
      >
        <span className={styles.srOnly}>
          {ariaLabel}
        </span>
      </div>
    </div>
  );
};

export default LoadingSpinner;