import React, { useState, memo, useCallback } from 'react';
import type { CurrentWeather, WeatherError } from '@/types';
import { LoadingSpinner } from '@/components';
import LazyImage from '../LazyImage/LazyImage';
import styles from './WeatherCard.module.css';

export interface WeatherCardProps {
  weatherData?: CurrentWeather | null;
  isLoading?: boolean;
  error?: WeatherError | null;
  onRetry?: () => void;
  className?: string;
  showDetails?: boolean;
}

/**
 * WeatherCard component for displaying current weather conditions
 * Features temperature toggle (C°/F°), responsive design, and error handling
 * Optimized with React.memo() to prevent unnecessary re-renders
 */
const WeatherCard: React.FC<WeatherCardProps> = memo(({
  weatherData,
  isLoading = false,
  error = null,
  onRetry,
  className = '',
  showDetails = true
}) => {
  const [temperatureUnit, setTemperatureUnit] = useState<'celsius' | 'fahrenheit'>('celsius');

  const handleTemperatureToggle = useCallback(() => {
    setTemperatureUnit(prev => prev === 'celsius' ? 'fahrenheit' : 'celsius');
  }, []);

  const formatTemperature = (temp: number) => {
    return `${Math.round(temp)}°`;
  };

  const formatWindSpeed = (speed: number) => {
    return `${Math.round(speed)} km/h`;
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(timestamp);
  };

  const containerClasses = [
    styles.container,
    className
  ].filter(Boolean).join(' ');

  // Loading state
  if (isLoading) {
    return (
      <div className={containerClasses}>
        <div className={styles.loadingContainer}>
          <LoadingSpinner size="large" aria-label="Loading weather data..." />
          <p className={styles.loadingText}>Loading weather data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={containerClasses}>
        <div className={styles.errorContainer} role="alert">
          <div className={styles.errorIcon}>⚠️</div>
          <div className={styles.errorContent}>
            <h3 className={styles.errorTitle}>Unable to load weather data</h3>
            <p className={styles.errorMessage}>{error.message}</p>
            {onRetry && error.retryable && (
              <button
                onClick={onRetry}
                className={styles.retryButton}
                aria-label="Retry loading weather data"
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
  if (!weatherData) {
    return (
      <div className={containerClasses}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🌤️</div>
          <p className={styles.emptyText}>Search for a city to see weather information</p>
        </div>
      </div>
    );
  }

  const currentTemp = temperatureUnit === 'celsius' 
    ? weatherData.temperature.celsius 
    : weatherData.temperature.fahrenheit;

  const unitSymbol = temperatureUnit === 'celsius' ? 'C' : 'F';

  return (
    <div className={containerClasses}>
      <div className={styles.header}>
        <div className={styles.locationInfo}>
          <h2 className={styles.locationName}>{weatherData.location.name}</h2>
          <p className={styles.locationCountry}>{weatherData.location.country}</p>
        </div>
        <div className={styles.timestamp}>
          Updated {formatTimestamp(weatherData.timestamp)}
        </div>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.temperatureSection}>
          <div className={styles.temperatureDisplay}>
            <span className={styles.temperature}>
              {formatTemperature(currentTemp)}
            </span>
            <button
              onClick={handleTemperatureToggle}
              className={styles.unitToggle}
              aria-label={`Switch to ${temperatureUnit === 'celsius' ? 'Fahrenheit' : 'Celsius'}`}
              title={`Switch to ${temperatureUnit === 'celsius' ? 'Fahrenheit' : 'Celsius'}`}
            >
              {unitSymbol}
            </button>
          </div>
          <div className={styles.description}>
            {weatherData.description}
          </div>
        </div>

        <div className={styles.weatherIcon}>
          <LazyImage
            src={`https://openweathermap.org/img/wn/${weatherData.icon}@2x.png`}
            alt={weatherData.description}
            className={styles.iconImage || ''}
            width="100px"
            height="100px"
            loading="lazy"
            fallback="/weather-icons/default.png"
          />
        </div>
      </div>

      {showDetails && (
        <div className={styles.details}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Humidity</span>
            <span className={styles.detailValue}>{weatherData.humidity}%</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Wind Speed</span>
            <span className={styles.detailValue}>{formatWindSpeed(weatherData.windSpeed)}</span>
          </div>
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo()
  // Only re-render if these specific props change
  return (
    prevProps.weatherData === nextProps.weatherData &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.error === nextProps.error &&
    prevProps.className === nextProps.className &&
    prevProps.showDetails === nextProps.showDetails &&
    prevProps.onRetry === nextProps.onRetry
  );
});

// Set display name for debugging
WeatherCard.displayName = 'WeatherCard';

export default WeatherCard;