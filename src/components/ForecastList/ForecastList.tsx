import React, { useState, useRef, useEffect, memo, useCallback, useMemo } from 'react';
import type { ForecastDay, WeatherError } from '@/types';
import { LoadingSpinner } from '@/components';
import LazyImage from '../LazyImage/LazyImage';
import styles from './ForecastList.module.css';

export interface ForecastListProps {
  forecastData?: ForecastDay[] | null;
  isLoading?: boolean;
  error?: WeatherError | null;
  onRetry?: () => void;
  className?: string;
  temperatureUnit?: 'celsius' | 'fahrenheit';
}

/**
 * ForecastList component for displaying 5-day weather forecast
 * Features responsive layout, swipe gestures on mobile, and accessibility
 * Optimized with React.memo() to prevent unnecessary re-renders
 */
const ForecastList: React.FC<ForecastListProps> = memo(({
  forecastData,
  isLoading = false,
  error = null,
  onRetry,
  className = '',
  temperatureUnit = 'celsius'
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const formatTemperature = (temp: number) => {
    const convertedTemp = temperatureUnit === 'fahrenheit' 
      ? (temp * 9/5) + 32 
      : temp;
    return `${Math.round(convertedTemp)}°`;
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      }).format(date);
    }
  };

  const formatDayName = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'long'
      }).format(date);
    }
  };

  // Touch/Mouse event handlers for swipe functionality
  const handleStart = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    setStartX(clientX);
    setScrollLeft(containerRef.current.scrollLeft);
  }, []);

  const handleMove = useCallback((clientX: number) => {
    if (!isDragging || !containerRef.current) return;
    
    const x = clientX;
    const walk = (x - startX) * 2; // Scroll speed multiplier
    containerRef.current.scrollLeft = scrollLeft - walk;
  }, [isDragging, startX, scrollLeft]);

  const handleEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Mouse events
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    handleStart(e.clientX);
  }, [handleStart]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    handleMove(e.clientX);
  }, [handleMove]);

  const handleMouseUp = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  const handleMouseLeave = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  // Touch events
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX);
  }, [handleStart]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  }, [handleMove]);

  const handleTouchEnd = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!forecastData) return;

    if (e.key === 'ArrowLeft' && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (e.key === 'ArrowRight' && currentIndex < forecastData.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [forecastData, currentIndex]);

  const containerClasses = [
    styles.container,
    className
  ].filter(Boolean).join(' ');

  // Loading state
  if (isLoading) {
    return (
      <div className={containerClasses}>
        <div className={styles.header}>
          <h3 className={styles.title}>5-Day Forecast</h3>
        </div>
        <div className={styles.loadingContainer}>
          <LoadingSpinner size="medium" aria-label="Loading forecast data..." />
          <p className={styles.loadingText}>Loading forecast...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={containerClasses}>
        <div className={styles.header}>
          <h3 className={styles.title}>5-Day Forecast</h3>
        </div>
        <div className={styles.errorContainer} role="alert">
          <div className={styles.errorIcon}>⚠️</div>
          <div className={styles.errorContent}>
            <h4 className={styles.errorTitle}>Unable to load forecast</h4>
            <p className={styles.errorMessage}>{error.message}</p>
            {onRetry && error.retryable && (
              <button
                onClick={onRetry}
                className={styles.retryButton}
                aria-label="Retry loading forecast data"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!forecastData || forecastData.length === 0) {
    return (
      <div className={containerClasses}>
        <div className={styles.header}>
          <h3 className={styles.title}>5-Day Forecast</h3>
        </div>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📅</div>
          <p className={styles.emptyText}>No forecast data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <div className={styles.header}>
        <h3 className={styles.title}>5-Day Forecast</h3>
        <div className={styles.unitIndicator}>
          {temperatureUnit === 'celsius' ? '°C' : '°F'}
        </div>
      </div>

      <div
        ref={containerRef}
        className={styles.forecastContainer}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="list"
        aria-label="5-day weather forecast"
      >
        {forecastData.map((day, index) => (
          <div
            key={`${day.date.toISOString()}-${index}`}
            className={styles.forecastItem}
            role="listitem"
            aria-label={`${formatDayName(day.date)} forecast: ${day.description}, high ${formatTemperature(day.highTemp)}, low ${formatTemperature(day.lowTemp)}`}
          >
            <div className={styles.dayInfo}>
              <div className={styles.dayName}>
                {formatDate(day.date)}
              </div>
            </div>

            <div className={styles.weatherIcon}>
              <LazyImage
                src={`https://openweathermap.org/img/wn/${day.icon}@2x.png`}
                alt={day.description}
                className={styles.iconImage || ''}
                width="64px"
                height="64px"
                loading="lazy"
                fallback="/weather-icons/default.png"
              />
            </div>

            <div className={styles.description}>
              {day.description}
            </div>

            <div className={styles.temperatures}>
              <span className={styles.highTemp}>
                {formatTemperature(day.highTemp)}
              </span>
              <span className={styles.tempSeparator}>/</span>
              <span className={styles.lowTemp}>
                {formatTemperature(day.lowTemp)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile swipe indicator */}
      <div className={styles.swipeIndicator} aria-hidden="true">
        <div className={styles.swipeText}>Swipe to see more</div>
        <div className={styles.swipeArrow}>→</div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo()
  // Only re-render if these specific props change
  return (
    prevProps.forecastData === nextProps.forecastData &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.error === nextProps.error &&
    prevProps.className === nextProps.className &&
    prevProps.temperatureUnit === nextProps.temperatureUnit &&
    prevProps.onRetry === nextProps.onRetry
  );
});

// Set display name for debugging
ForecastList.displayName = 'ForecastList';

export default ForecastList;