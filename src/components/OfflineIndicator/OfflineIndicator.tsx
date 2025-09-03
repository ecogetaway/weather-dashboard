import React, { useState, useEffect } from 'react';
import { useNetworkStatus, useOnlineStatus } from '@/hooks/useNetworkStatus';
import { useToastHelpers } from '@/contexts/ToastContext';
import styles from './OfflineIndicator.module.css';

export interface OfflineIndicatorProps {
  showToast?: boolean;
  showBanner?: boolean;
  onOnline?: () => void;
  onOffline?: () => void;
  className?: string;
}

/**
 * OfflineIndicator component for displaying network status
 * Shows offline banner and provides connection quality information
 */
const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  showToast = true,
  showBanner = true,
  onOnline,
  onOffline,
  className = ''
}) => {
  const networkStatus = useNetworkStatus();
  const { showWarning, showInfo, showError } = useToastHelpers();
  const [wasOffline, setWasOffline] = useState(false);
  const [showSlowConnectionWarning, setShowSlowConnectionWarning] = useState(false);

  // Handle online/offline transitions
  useOnlineStatus(
    () => {
      if (wasOffline && showToast) {
        showInfo(
          'Back online!',
          'Your internet connection has been restored.',
          { duration: 3000 }
        );
      }
      setWasOffline(false);
      onOnline?.();
    },
    () => {
      if (showToast) {
        showError(
          'No internet connection',
          'You are currently offline. Some features may not work.',
          { duration: 0 } // Don't auto-dismiss
        );
      }
      setWasOffline(true);
      onOffline?.();
    }
  );

  // Handle slow connection warnings
  useEffect(() => {
    if (networkStatus.isOnline && networkStatus.isSlowConnection && !showSlowConnectionWarning) {
      if (showToast) {
        showWarning(
          'Slow connection detected',
          'Your internet connection is slow. Loading may take longer.',
          { duration: 5000 }
        );
      }
      setShowSlowConnectionWarning(true);
    } else if (!networkStatus.isSlowConnection) {
      setShowSlowConnectionWarning(false);
    }
  }, [networkStatus.isSlowConnection, networkStatus.isOnline, showToast, showWarning, showSlowConnectionWarning]);

  if (!showBanner || networkStatus.isOnline) {
    return null;
  }

  const containerClasses = [
    styles.container,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses} role="alert" aria-live="polite">
      <div className={styles.content}>
        <div className={styles.icon}>📡</div>
        <div className={styles.text}>
          <div className={styles.title}>No Internet Connection</div>
          <div className={styles.message}>
            Check your connection and try again. Some features may not work offline.
          </div>
        </div>
        <button
          onClick={() => window.location.reload()}
          className={styles.retryButton}
          aria-label="Retry connection"
        >
          Retry
        </button>
      </div>
    </div>
  );
};

export default OfflineIndicator;