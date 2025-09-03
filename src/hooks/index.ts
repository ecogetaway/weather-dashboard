// Custom React hooks for weather dashboard
import { useState, useEffect } from 'react';
import type { CurrentWeather, ForecastData } from '@/types';

/**
 * Hook for managing weather data state
 */
export const useWeather = () => {
  const [weather, setWeather] = useState<CurrentWeather | null>(null);
  const [forecast, setForecast] = useState<ForecastData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return {
    weather,
    forecast,
    loading,
    error,
    setWeather,
    setForecast,
    setLoading,
    setError,
  };
};

/**
 * Hook for geolocation
 */
export const useGeolocation = () => {
  const [coordinates, setCoordinates] = useState<{lat: number; lng: number} | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        setError(error.message);
      }
    );
  }, []);

  return { coordinates, error };
};