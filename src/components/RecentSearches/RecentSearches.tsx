import React, { memo, useCallback } from 'react';
import type { Location } from '@/types';
import styles from './RecentSearches.module.css';

export interface RecentSearchesProps {
  recentLocations?: Location[] | null;
  onLocationSelect?: (location: Location) => void;
  onLocationRemove?: (locationId: string) => void;
  className?: string;
  isLoading?: boolean;
  maxItems?: number;
}

/**
 * RecentSearches component for displaying and managing recently searched locations
 * Features responsive layout, touch-friendly interactions, and accessibility
 * Optimized with React.memo() to prevent unnecessary re-renders
 */
const RecentSearches: React.FC<RecentSearchesProps> = memo(({
  recentLocations,
  onLocationSelect,
  onLocationRemove,
  className = '',
  isLoading = false,
  maxItems = 5
}) => {
  const handleLocationClick = useCallback((location: Location) => {
    if (onLocationSelect && !isLoading) {
      onLocationSelect(location);
    }
  }, [onLocationSelect, isLoading]);

  const handleRemoveClick = useCallback((e: React.MouseEvent, locationId: string) => {
    e.stopPropagation(); // Prevent triggering location select
    if (onLocationRemove && !isLoading) {
      onLocationRemove(locationId);
    }
  }, [onLocationRemove, isLoading]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, location: Location) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleLocationClick(location);
    }
  }, [handleLocationClick]);

  const handleRemoveKeyDown = useCallback((e: React.KeyboardEvent, locationId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      if (onLocationRemove && !isLoading) {
        onLocationRemove(locationId);
      }
    }
  }, [onLocationRemove, isLoading]);

  const containerClasses = [
    styles.container,
    className
  ].filter(Boolean).join(' ');

  // Don't render if no recent locations and not loading
  if (!isLoading && (!recentLocations || recentLocations.length === 0)) {
    return null;
  }

  return (
    <div className={containerClasses}>
      <div className={styles.header}>
        <h3 className={styles.title}>Recent Searches</h3>
        {recentLocations && recentLocations.length > 0 && (
          <span className={styles.count}>
            {recentLocations.length}/{maxItems}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingText}>Loading recent searches...</div>
        </div>
      ) : (
        <div 
          className={styles.locationsContainer}
          role="list"
          aria-label="Recent search locations"
        >
          {recentLocations?.map((location, index) => (
            <div
              key={`${location.id}-${index}`}
              className={styles.locationItem}
              role="listitem"
              tabIndex={0}
              onClick={() => handleLocationClick(location)}
              onKeyDown={(e) => handleKeyDown(e, location)}
              aria-label={`Load weather for ${location.name}, ${location.country}`}
            >
              <div className={styles.locationInfo}>
                <div className={styles.locationName}>
                  {location.name}
                </div>
                <div className={styles.locationCountry}>
                  {location.country}
                </div>
              </div>

              <div className={styles.locationActions}>
                {onLocationRemove && (
                  <button
                    className={styles.removeButton}
                    onClick={(e) => handleRemoveClick(e, location.id)}
                    onKeyDown={(e) => handleRemoveKeyDown(e, location.id)}
                    aria-label={`Remove ${location.name} from recent searches`}
                    title={`Remove ${location.name} from recent searches`}
                    type="button"
                  >
                    <span className={styles.removeIcon} aria-hidden="true">×</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {recentLocations && recentLocations.length === 0 && !isLoading && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🔍</div>
          <p className={styles.emptyText}>
            No recent searches yet. Search for a city to see it here.
          </p>
        </div>
      )}

      {/* Mobile hint */}
      <div className={styles.mobileHint} aria-hidden="true">
        <span className={styles.hintText}>Tap to load weather</span>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo()
  // Only re-render if these specific props change
  return (
    prevProps.recentLocations === nextProps.recentLocations &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.className === nextProps.className &&
    prevProps.maxItems === nextProps.maxItems &&
    prevProps.onLocationSelect === nextProps.onLocationSelect &&
    prevProps.onLocationRemove === nextProps.onLocationRemove
  );
});

// Set display name for debugging
RecentSearches.displayName = 'RecentSearches';

export default RecentSearches;