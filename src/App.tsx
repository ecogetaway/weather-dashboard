import React, { useState, useEffect, useCallback } from 'react';
import {
  SearchBar,
  WeatherCard,
  ForecastList,
  RecentSearches,
  ErrorBoundary,
} from '@/components/LazyComponents';
import OfflineIndicator from '@/components/OfflineIndicator/OfflineIndicator';
import OfflineFallback from '@/components/OfflineFallback/OfflineFallback';
import PerformanceMonitor from '@/components/PerformanceMonitor/PerformanceMonitor';
import { ToastProvider, useToastHelpers } from '@/contexts/ToastContext';
import { useNetworkStatus, useOnlineStatus } from '@/hooks/useNetworkStatus';
import { useOfflineManager } from '@/hooks/useOfflineManager';
import { WeatherService } from '@/services/weatherService';
import { StorageService } from '@/services/storageService';
import type { 
  Location, 
  CurrentWeather, 
  ForecastDay, 
  WeatherError,
  TemperatureUnit 
} from '@/types';
import './App.css';

/**
 * Weather Dashboard Application with toast integration
 * Integrates all components with centralized state management and user feedback
 */
function WeatherApp() {
  const { showSuccess, showError, showWarning, showInfo } = useToastHelpers();
  const offlineManager = useOfflineManager();
  
  // Services
  const [weatherService] = useState(() => new WeatherService());
  const [storageService] = useState(() => new StorageService());

  // Application state
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(null);
  const [forecast, setForecast] = useState<ForecastDay[] | null>(null);
  const [recentSearches, setRecentSearches] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [temperatureUnit, setTemperatureUnit] = useState<TemperatureUnit>('celsius');

  // Loading states
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [isLoadingForecast, setIsLoadingForecast] = useState(false);
  const [isLoadingRecentSearches, setIsLoadingRecentSearches] = useState(false);

  // Error states
  const [weatherError, setWeatherError] = useState<WeatherError | null>(null);
  const [forecastError, setForecastError] = useState<WeatherError | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Load recent searches on app initialization
  useEffect(() => {
    const loadRecentSearches = async () => {
      setIsLoadingRecentSearches(true);
      try {
        const recent = storageService.getRecentSearches();
        setRecentSearches(recent);
        
        // Load temperature preference
        const tempUnit = storageService.getTemperatureUnit();
        setTemperatureUnit(tempUnit);
      } catch (error) {
        console.warn('Failed to load recent searches:', error);
      } finally {
        setIsLoadingRecentSearches(false);
      }
    };

    loadRecentSearches();
  }, [storageService]);

  // Fetch weather data for a location
  const fetchWeatherData = useCallback(async (location: Location) => {
    setSelectedLocation(location);
    setWeatherError(null);
    setForecastError(null);
    setIsLoadingWeather(true);
    setIsLoadingForecast(true);

    try {
      // Fetch current weather and forecast in parallel using offline-aware methods
      const [weatherData, forecastData] = await Promise.allSettled([
        weatherService.getCurrentWeatherOffline(location),
        weatherService.getForecastOffline(location, 5)
      ]);

      // Handle current weather result
      if (weatherData.status === 'fulfilled') {
        setCurrentWeather(weatherData.value);
        setWeatherError(null);
        showSuccess(
          'Weather data loaded',
          `Current weather for ${location.name} updated successfully`
        );
      } else {
        console.error('Weather fetch failed:', weatherData.reason);
        const errorObj = {
          type: 'api' as const,
          message: 'Failed to load current weather data',
          retryable: true,
        };
        setWeatherError(errorObj);
        setCurrentWeather(null);
        showError(
          'Weather data failed to load',
          `Unable to get current weather for ${location.name}. Please try again.`,
          {
            action: {
              label: 'Retry',
              onClick: () => handleRetryWeather()
            }
          }
        );
      }

      // Handle forecast result
      if (forecastData.status === 'fulfilled') {
        setForecast(forecastData.value);
        setForecastError(null);
      } else {
        console.error('Forecast fetch failed:', forecastData.reason);
        const errorObj = {
          type: 'api' as const,
          message: 'Failed to load forecast data',
          retryable: true,
        };
        setForecastError(errorObj);
        setForecast(null);
        showWarning(
          'Forecast data unavailable',
          `Could not load 5-day forecast for ${location.name}`,
          {
            action: {
              label: 'Retry',
              onClick: () => handleRetryForecast()
            }
          }
        );
      }

      // Add to recent searches if weather fetch was successful
      if (weatherData.status === 'fulfilled') {
        storageService.addRecentSearch(location);
        setRecentSearches(storageService.getRecentSearches());
        showInfo(
          'Location saved',
          `${location.name} added to recent searches`
        );
      }

    } catch (error) {
      console.error('Unexpected error fetching weather data:', error);
      const errorObj: WeatherError = {
        type: 'network',
        message: 'Unable to fetch weather data. Please check your connection.',
        retryable: true,
      };
      setWeatherError(errorObj);
      setForecastError(errorObj);
    } finally {
      setIsLoadingWeather(false);
      setIsLoadingForecast(false);
    }
  }, [weatherService, storageService]);

  // Handle location selection from search or recent searches
  const handleLocationSelect = useCallback((location: Location) => {
    fetchWeatherData(location);
  }, [fetchWeatherData]);

  // Handle location removal from recent searches
  const handleLocationRemove = useCallback((locationId: string) => {
    const removedLocation = recentSearches.find(loc => loc.id === locationId);
    storageService.removeRecentSearch(locationId);
    setRecentSearches(storageService.getRecentSearches());
    
    if (removedLocation) {
      showInfo(
        'Location removed',
        `${removedLocation.name} removed from recent searches`
      );
    }
  }, [storageService, recentSearches, showInfo]);

  // Handle temperature unit toggle
  const handleTemperatureUnitChange = useCallback((unit: TemperatureUnit) => {
    setTemperatureUnit(unit);
    storageService.setTemperatureUnit(unit);
    
    showInfo(
      'Temperature unit changed',
      `Now displaying temperatures in ${unit === 'celsius' ? 'Celsius' : 'Fahrenheit'}`
    );
  }, [storageService, showInfo]);

  // Retry handlers
  const handleRetryWeather = useCallback(() => {
    if (selectedLocation) {
      setWeatherError(null);
      setIsLoadingWeather(true);
      
      weatherService.getCurrentWeatherOffline(selectedLocation)
        .then(weatherData => {
          setCurrentWeather(weatherData);
          setWeatherError(null);
          showSuccess(
            'Weather data refreshed',
            `Successfully updated weather for ${selectedLocation.name}`
          );
        })
        .catch(error => {
          console.error('Weather retry failed:', error);
          setWeatherError({
            type: 'api',
            message: 'Failed to load current weather data',
            retryable: true,
          });
          showError(
            'Retry failed',
            'Still unable to load weather data. Please check your connection.'
          );
        })
        .finally(() => {
          setIsLoadingWeather(false);
        });
    }
  }, [selectedLocation, weatherService]);

  const handleRetryForecast = useCallback(() => {
    if (selectedLocation) {
      setForecastError(null);
      setIsLoadingForecast(true);
      
      weatherService.getForecastOffline(selectedLocation, 5)
        .then(forecastData => {
          setForecast(forecastData);
          setForecastError(null);
          showSuccess(
            'Forecast data refreshed',
            `Successfully updated 5-day forecast for ${selectedLocation.name}`
          );
        })
        .catch(error => {
          console.error('Forecast retry failed:', error);
          setForecastError({
            type: 'api',
            message: 'Failed to load forecast data',
            retryable: true,
          });
          showError(
            'Forecast retry failed',
            'Still unable to load forecast data. Please check your connection.'
          );
        })
        .finally(() => {
          setIsLoadingForecast(false);
        });
    }
  }, [selectedLocation, weatherService]);

  return (
    <ErrorBoundary>
      <div className="app">
        <OfflineIndicator 
          onRetryOfflineRequests={offlineManager.processOfflineQueue}
          showConnectionQuality={true}
        />
        <PerformanceMonitor 
          enabled={process.env.NODE_ENV === 'development'}
          onMetricsUpdate={(metrics) => {
            // Log performance metrics for monitoring
            if (metrics.score < 70) {
              console.warn('Performance score below threshold:', metrics);
            }
          }}
        />
        <div className="app-container">
        {/* Header */}
        <header className="app-header">
          <div className="header-content">
            <h1 className="app-title">Weather Dashboard</h1>
            <p className="app-subtitle">Get current weather and forecasts for any location</p>
          </div>
        </header>

        {/* Main Content */}
        <main className="app-main">
          {/* Search Section */}
          <section className="search-section">
            <SearchBar
              onLocationSelect={handleLocationSelect}
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search for a city..."
              className="search-bar"
            />
          </section>

          {/* Recent Searches */}
          {(recentSearches.length > 0 || isLoadingRecentSearches) && (
            <section className="recent-searches-section">
              <RecentSearches
                recentLocations={recentSearches}
                onLocationSelect={handleLocationSelect}
                onLocationRemove={handleLocationRemove}
                isLoading={isLoadingRecentSearches}
                className="recent-searches"
              />
            </section>
          )}

          {/* Weather Content */}
          {(currentWeather || isLoadingWeather || weatherError) && (
            <section className="weather-section">
              <WeatherCard
                weatherData={currentWeather}
                isLoading={isLoadingWeather}
                error={weatherError}
                onRetry={handleRetryWeather}
                className="weather-card"
              />
              {/* Show offline fallback if offline and no current data but have cached data */}
              {offlineManager.isOffline && !currentWeather && !isLoadingWeather && selectedLocation && offlineManager.hasCachedData(selectedLocation.id) && (
                <OfflineFallback
                  locationName={selectedLocation.name}
                  showCachedData={true}
                  onRetry={() => fetchWeatherData(selectedLocation)}
                />
              )}
            </section>
          )}

          {/* Forecast Content */}
          {(forecast || isLoadingForecast || forecastError) && (
            <section className="forecast-section">
              <ForecastList
                forecastData={forecast}
                isLoading={isLoadingForecast}
                error={forecastError}
                onRetry={handleRetryForecast}
                temperatureUnit={temperatureUnit}
                className="forecast-list"
              />
              {/* Show offline fallback if offline and no forecast data but have cached data */}
              {offlineManager.isOffline && !forecast && !isLoadingForecast && selectedLocation && offlineManager.hasCachedData(selectedLocation.id) && (
                <OfflineFallback
                  locationName={selectedLocation.name}
                  showCachedData={true}
                  onRetry={() => fetchWeatherData(selectedLocation)}
                />
              )}
            </section>
          )}

          {/* Empty State */}
          {!currentWeather && !isLoadingWeather && !weatherError && recentSearches.length === 0 && !isLoadingRecentSearches && (
            <section className="empty-state">
              <div className="empty-state-content">
                <div className="empty-state-icon">🌤️</div>
                <h2 className="empty-state-title">Welcome to Weather Dashboard</h2>
                <p className="empty-state-description">
                  Search for any city to get current weather conditions and a 5-day forecast.
                </p>
              </div>
            </section>
          )}
        </main>

        {/* Footer */}
        <footer className="app-footer">
          <div className="footer-content">
            <p className="footer-text">
              Weather data provided by OpenWeatherMap
            </p>
            <button
              onClick={() => handleTemperatureUnitChange(temperatureUnit === 'celsius' ? 'fahrenheit' : 'celsius')}
              className="temperature-toggle"
              aria-label={`Switch to ${temperatureUnit === 'celsius' ? 'Fahrenheit' : 'Celsius'}`}
            >
              °{temperatureUnit === 'celsius' ? 'C' : 'F'}
            </button>
          </div>
        </footer>
      </div>
    </div>
    </ErrorBoundary>
  );
}

/**
 * Main App component with ToastProvider wrapper
 */
function App() {
  return (
    <ToastProvider position="top-right" maxToasts={5}>
      <ErrorBoundary level="page" onError={(error, errorInfo) => {
        console.error('Application Error:', error, errorInfo);
      }}>
        <WeatherApp />
      </ErrorBoundary>
    </ToastProvider>
  );
}

export default App;
