import React from 'react';
import { useOfflineManager } from '@/hooks/useOfflineManager';
import RetryButton from '@/components/RetryButton/RetryButton';
import styles from './OfflineFallback.module.css';

export interface OfflineFallbackProps {
  locationName?: string;
  showCachedData?: boolean;
  onRetry?: () => void;
  className?: string;
}

/**
 * OfflineFallback component for displaying offline state and cached data
 * Shows appropriate messaging and retry options when offline
 */
const OfflineFallback: React.FC<OfflineFallbackProps> = ({
  locationName,
  showCachedData = false,
  onRetry,
  className = ''
}) => {
  const { isOffline, hasOfflineData, processOfflineQueue } = useOfflineManager();

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      processOfflineQueue();
    }
  };

  if (!isOffline) {
    return null;
  }

  const fallbackClasses = [
    styles.fallback,
    showCachedData ? styles.withCachedData : styles.noCachedData,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={fallbackClasses} role="alert" aria-live="polite">
      <div className={styles.content}>
        <div className={styles.icon} aria-hidden="true">
          📡
        </div>
        
        <div className={styles.message}>
          <h3 className={styles.title}>
            {showCachedData ? 'Showing cached data' : 'You\'re offline'}
          </h3>
          
          <p className={styles.description}>
            {showCachedData ? (
              <>
                {locationName ? `Weather data for ${locationName} ` : 'Weather data '}
                may not be up to date. Connect to the internet for the latest information.
              </>
            ) : (
              <>
                {locationName ? `Cannot load weather data for ${locationName}. ` : 'Cannot load weather data. '}
                Check your internet connection and try again.
              </>
            )}
          </p>

          {hasOfflineData && !showCachedData && (
            <p className={styles.cacheInfo}>
              Some cached weather data is available for other locations.
            </p>
          )}
        </div>

        <div className={styles.actions}>
          <RetryButton
            onRetry={handleRetry}
            disabled={false}
            size="medium"
            variant="primary"
          >
            {showCachedData ? 'Refresh data' : 'Try again'}
          </RetryButton>
        </div>
      </div>

      {showCachedData && (
        <div className={styles.cacheNotice}>
          <span className={styles.cacheIcon} aria-hidden="true">ℹ️</span>
          <span className={styles.cacheText}>
            This data was cached when you were last online
          </span>
        </div>
      )}
    </div>
  );
};

export default OfflineFallback;