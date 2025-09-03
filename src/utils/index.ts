// Utility functions for weather dashboard

/**
 * Format temperature with unit
 */
export const formatTemperature = (temp: number, unit: 'C' | 'F' = 'C'): string => {
  return `${Math.round(temp)}°${unit}`;
};

/**
 * Format wind speed with unit
 */
export const formatWindSpeed = (speed: number, unit: 'kmh' | 'mph' = 'kmh'): string => {
  return `${Math.round(speed)} ${unit}`;
};

/**
 * Format date for display
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Get weather icon URL or fallback
 */
export const getWeatherIcon = (iconCode: string): string => {
  // This will be implemented when we integrate with the weather API
  return `/icons/${iconCode}.svg`;
};

/**
 * Validate location coordinates
 */
export const isValidCoordinates = (lat: number, lng: number): boolean => {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};