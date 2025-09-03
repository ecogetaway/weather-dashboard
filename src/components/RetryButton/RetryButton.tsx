import React, { useState } from 'react';
import { useRetry } from '@/hooks/useRetry';
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner';
import styles from './RetryButton.module.css';

export interface RetryButtonProps {
  onRetry: () => Promise<void> | void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'outline';
  children?: React.ReactNode;
  maxRetries?: number;
  retryDelay?: number;
  className?: string;
  'aria-label'?: string;
}

/**
 * RetryButton component with built-in retry logic and loading states
 * Provides exponential backoff and retry count management
 */
const RetryButton: React.FC<RetryButtonProps> = ({
  onRetry,
  disabled = false,
  size = 'medium',
  variant = 'primary',
  children = 'Retry',
  maxRetries = 3,
  retryDelay = 1000,
  className = '',
  'aria-label': ariaLabel,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { retry, retryCount, isRetrying } = useRetry({
    maxRetries,
    delay: retryDelay,
  });

  const handleClick = async () => {
    if (disabled || isLoading || isRetrying) {
      return;
    }

    setIsLoading(true);
    
    try {
      await retry(onRetry);
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isDisabled = disabled || isLoading || isRetrying || retryCount >= maxRetries;
  const showSpinner = isLoading || isRetrying;

  const buttonClasses = [
    styles.retryButton,
    styles[size],
    styles[variant],
    isDisabled ? styles.disabled : '',
    showSpinner ? styles.loading : '',
    className
  ].filter(Boolean).join(' ');

  const getButtonText = () => {
    if (showSpinner) {
      return retryCount > 0 ? `Retrying... (${retryCount}/${maxRetries})` : 'Retrying...';
    }
    if (retryCount >= maxRetries) {
      return 'Max retries reached';
    }
    if (retryCount > 0) {
      return `${children} (${retryCount}/${maxRetries})`;
    }
    return children;
  };

  return (
    <button
      type="button"
      className={buttonClasses}
      onClick={handleClick}
      disabled={isDisabled}
      aria-label={ariaLabel || `${children}${retryCount > 0 ? `, attempt ${retryCount + 1} of ${maxRetries}` : ''}`}
      aria-describedby={showSpinner ? 'retry-status' : undefined}
    >
      <span className={styles.content}>
        {showSpinner && (
          <LoadingSpinner 
            size="small" 
            className={styles.spinner}
            aria-hidden="true"
          />
        )}
        <span className={styles.text}>
          {getButtonText()}
        </span>
      </span>
      
      {showSpinner && (
        <span id="retry-status" className="sr-only">
          Retrying operation, please wait
        </span>
      )}
    </button>
  );
};

export default RetryButton;