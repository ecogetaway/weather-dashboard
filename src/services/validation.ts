// ============================================================================
// VALIDATION SERVICE WITH INPUT SANITIZATION
// ============================================================================

import {
  VALIDATION_RULES,
  type ValidationResult,
  type WeatherError,
  type OpenWeatherCurrentResponse,
  type OpenWeatherForecastResponse,
  type CurrentWeather,
  type ForecastData,
} from '@/types';

// ============================================================================
// INPUT SANITIZATION FUNCTIONS
// ============================================================================

/**
 * Sanitizes city name input to prevent injection attacks
 */
export const sanitizeCityName = (input: string): string => {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .trim() // Remove leading/trailing whitespace
    .replace(/<[^>]*>/g, '') // Remove HTML tags first
    .replace(/[<>\"'&]/g, '') // Remove potentially dangerous characters
    .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
    .slice(0, VALIDATION_RULES.cityName.maxLength); // Enforce max length
};

/**
 * Sanitizes and normalizes temperature values
 */
export const sanitizeTemperature = (input: unknown): number | null => {
  if (typeof input === 'number') {
    if (isNaN(input) || !isFinite(input)) {
      return null;
    }
    return Math.round(input * 100) / 100; // Round to 2 decimal places
  }

  if (typeof input === 'string') {
    const parsed = parseFloat(input.trim());
    if (isNaN(parsed) || !isFinite(parsed)) {
      return null;
    }
    return Math.round(parsed * 100) / 100;
  }

  return null;
};

/**
 * Sanitizes string input for general use
 */
export const sanitizeString = (input: unknown, maxLength = 100): string => {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .replace(/[<>\"'&]/g, '') // Remove HTML/script injection characters
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .slice(0, maxLength);
};

// ============================================================================
// CITY NAME VALIDATION
// ============================================================================

/**
 * Validates city name with regex pattern matching
 */
export const validateCityName = (cityName: string): ValidationResult => {
  const errors: string[] = [];
  const trimmed = cityName.trim();

  // Check if required
  if (VALIDATION_RULES.cityName.required && !trimmed) {
    errors.push('City name is required');
    return { isValid: false, errors };
  }

  // Check minimum length (on original input)
  if (trimmed.length < VALIDATION_RULES.cityName.minLength) {
    errors.push(`City name must be at least ${VALIDATION_RULES.cityName.minLength} characters long`);
  }

  // Check maximum length (on original input)
  if (trimmed.length > VALIDATION_RULES.cityName.maxLength) {
    errors.push(`City name must not exceed ${VALIDATION_RULES.cityName.maxLength} characters`);
  }

  // Sanitize for pattern checking
  const sanitized = sanitizeCityName(cityName);

  // Check pattern (letters, spaces, hyphens, apostrophes only)
  if (sanitized && !VALIDATION_RULES.cityName.pattern.test(sanitized)) {
    errors.push('City name can only contain letters, spaces, hyphens, and apostrophes');
  }

  // Check for common injection patterns (check original input before sanitization)
  const injectionPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /data:/i,
    /vbscript:/i,
  ];

  for (const pattern of injectionPatterns) {
    if (pattern.test(cityName)) {
      errors.push('Invalid characters detected in city name');
      break;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// ============================================================================
// TEMPERATURE VALIDATION
// ============================================================================

/**
 * Validates temperature values and converts units
 */
export const validateTemperature = (temperature: unknown): ValidationResult => {
  const errors: string[] = [];
  const sanitized = sanitizeTemperature(temperature);

  if (sanitized === null) {
    errors.push('Temperature must be a valid number');
    return { isValid: false, errors };
  }

  // Check temperature range (reasonable Earth temperatures)
  if (sanitized < VALIDATION_RULES.temperature.min) {
    errors.push(`Temperature cannot be below ${VALIDATION_RULES.temperature.min}°C`);
  }

  if (sanitized > VALIDATION_RULES.temperature.max) {
    errors.push(`Temperature cannot be above ${VALIDATION_RULES.temperature.max}°C`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Temperature conversion utilities with validation
 */
export const temperatureConversions = {
  celsiusToFahrenheit: (celsius: number): number => {
    const validation = validateTemperature(celsius);
    if (!validation.isValid) {
      throw new Error(`Invalid temperature: ${validation.errors.join(', ')}`);
    }
    return Math.round((celsius * 9/5 + 32) * 100) / 100;
  },

  fahrenheitToCelsius: (fahrenheit: number): number => {
    const celsius = (fahrenheit - 32) * 5/9;
    const validation = validateTemperature(celsius);
    if (!validation.isValid) {
      throw new Error(`Invalid temperature: ${validation.errors.join(', ')}`);
    }
    return Math.round(celsius * 100) / 100;
  },

  kelvinToCelsius: (kelvin: number): number => {
    const celsius = kelvin - 273.15;
    const validation = validateTemperature(celsius);
    if (!validation.isValid) {
      throw new Error(`Invalid temperature: ${validation.errors.join(', ')}`);
    }
    return Math.round(celsius * 100) / 100;
  },
};

// ============================================================================
// API RESPONSE VALIDATION
// ============================================================================

/**
 * Validates OpenWeatherMap current weather API response
 */
export const validateCurrentWeatherResponse = (response: unknown): ValidationResult => {
  const errors: string[] = [];

  if (!response || typeof response !== 'object') {
    errors.push('Invalid API response format');
    return { isValid: false, errors };
  }

  const data = response as Record<string, any>;

  // Check required fields
  for (const field of VALIDATION_RULES.apiResponse.requiredFields) {
    const fieldPath = field.split('.');
    let current = data;
    
    for (const part of fieldPath) {
      if (!current || typeof current !== 'object' || !(part in current)) {
        errors.push(`Missing required field: ${field}`);
        break;
      }
      current = current[part];
    }
  }

  // Validate specific fields
  if (data.name && typeof data.name !== 'string') {
    errors.push('City name must be a string');
  }

  if (data.main?.temp !== undefined) {
    const tempValidation = validateTemperature(data.main.temp);
    if (!tempValidation.isValid) {
      errors.push(`Invalid temperature: ${tempValidation.errors.join(', ')}`);
    }
  }

  if (data.main?.humidity !== undefined) {
    const humidity = sanitizeTemperature(data.main.humidity);
    if (humidity === null || humidity < 0 || humidity > 100) {
      errors.push('Humidity must be between 0 and 100');
    }
  }

  if (data.wind?.speed !== undefined) {
    const windSpeed = sanitizeTemperature(data.wind.speed);
    if (windSpeed === null || windSpeed < 0) {
      errors.push('Wind speed must be a positive number');
    }
  }

  if (data.weather && Array.isArray(data.weather)) {
    if (data.weather.length === 0) {
      errors.push('Weather conditions array cannot be empty');
    } else {
      const weather = data.weather[0];
      if (!weather.main || typeof weather.main !== 'string') {
        errors.push('Weather condition main field is required');
      }
      if (!weather.description || typeof weather.description !== 'string') {
        errors.push('Weather description is required');
      }
      if (!weather.icon || typeof weather.icon !== 'string') {
        errors.push('Weather icon is required');
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validates OpenWeatherMap forecast API response
 */
export const validateForecastResponse = (response: unknown): ValidationResult => {
  const errors: string[] = [];

  if (!response || typeof response !== 'object') {
    errors.push('Invalid forecast API response format');
    return { isValid: false, errors };
  }

  const data = response as Record<string, any>;

  if (!data.list || !Array.isArray(data.list)) {
    errors.push('Forecast list is required and must be an array');
    return { isValid: false, errors };
  }

  if (data.list.length === 0) {
    errors.push('Forecast list cannot be empty');
    return { isValid: false, errors };
  }

  // Validate each forecast item
  for (let i = 0; i < Math.min(data.list.length, 5); i++) {
    const item = data.list[i];
    const prefix = `Forecast item ${i + 1}:`;

    if (!item || typeof item !== 'object') {
      errors.push(`${prefix} Invalid format`);
      continue;
    }

    // Validate timestamp
    if (!item.dt || typeof item.dt !== 'number') {
      errors.push(`${prefix} Missing or invalid timestamp`);
    }

    // Validate temperatures
    if (!item.main || typeof item.main !== 'object') {
      errors.push(`${prefix} Missing main weather data`);
    } else {
      const tempMaxValidation = validateTemperature(item.main.temp_max);
      const tempMinValidation = validateTemperature(item.main.temp_min);
      
      if (!tempMaxValidation.isValid) {
        errors.push(`${prefix} Invalid max temperature`);
      }
      if (!tempMinValidation.isValid) {
        errors.push(`${prefix} Invalid min temperature`);
      }
    }

    // Validate weather conditions
    if (!item.weather || !Array.isArray(item.weather) || item.weather.length === 0) {
      errors.push(`${prefix} Missing weather conditions`);
    }

    // Validate precipitation probability
    if (item.pop !== undefined) {
      const pop = sanitizeTemperature(item.pop);
      if (pop === null || pop < 0 || pop > 1) {
        errors.push(`${prefix} Precipitation probability must be between 0 and 1`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// ============================================================================
// DATA TRANSFORMATION WITH VALIDATION
// ============================================================================

/**
 * Safely transforms API response to CurrentWeather with validation
 */
export const transformCurrentWeather = (response: OpenWeatherCurrentResponse): CurrentWeather => {
  const validation = validateCurrentWeatherResponse(response);
  if (!validation.isValid) {
    throw new Error(`Invalid weather data: ${validation.errors.join(', ')}`);
  }

  const weather = response.weather[0];
  if (!weather) {
    throw new Error('Weather conditions not found in response');
  }

  return {
    city: sanitizeString(response.name, 50),
    temperature: sanitizeTemperature(response.main.temp) ?? 0,
    condition: {
      main: sanitizeString(weather.main, 20),
      description: sanitizeString(weather.description, 50),
      icon: sanitizeString(weather.icon, 10),
    },
    humidity: sanitizeTemperature(response.main.humidity) ?? 0,
    windSpeed: sanitizeTemperature(response.wind.speed) ?? 0,
    timestamp: new Date(response.dt * 1000),
  };
};

/**
 * Safely transforms forecast API response to ForecastData array with validation
 */
export const transformForecastData = (response: OpenWeatherForecastResponse): ForecastData[] => {
  const validation = validateForecastResponse(response);
  if (!validation.isValid) {
    throw new Error(`Invalid forecast data: ${validation.errors.join(', ')}`);
  }

  return response.list.slice(0, 5).map((item) => {
    const weather = item.weather[0];
    if (!weather) {
      throw new Error('Weather conditions not found in forecast item');
    }

    return {
      date: new Date(item.dt * 1000),
      highTemp: sanitizeTemperature(item.main.temp_max) ?? 0,
      lowTemp: sanitizeTemperature(item.main.temp_min) ?? 0,
      condition: {
        main: sanitizeString(weather.main, 20),
        description: sanitizeString(weather.description, 50),
        icon: sanitizeString(weather.icon, 10),
      },
      precipitationChance: sanitizeTemperature(item.pop) ?? 0,
    };
  });
};

// ============================================================================
// VALIDATION ERROR FACTORY
// ============================================================================

/**
 * Creates standardized WeatherError from validation results
 */
export const createValidationError = (
  validationResult: ValidationResult,
  errorType: WeatherError['type'] = 'validation'
): WeatherError => {
  return {
    type: errorType,
    message: validationResult.errors.join('; '),
    retryable: errorType !== 'validation',
    details: `Validation failed: ${validationResult.errors.length} error(s)`,
  };
};

// ============================================================================
// COMPREHENSIVE VALIDATION SERVICE
// ============================================================================

export class ValidationService {
  /**
   * Validates and sanitizes city name input
   */
  static validateCityInput(input: string): { isValid: boolean; sanitized: string; errors: string[] } {
    const sanitized = sanitizeCityName(input);
    const validation = validateCityName(sanitized);
    
    return {
      isValid: validation.isValid,
      sanitized,
      errors: validation.errors,
    };
  }

  /**
   * Validates API response and transforms to application format
   */
  static validateAndTransformCurrentWeather(response: unknown): CurrentWeather {
    if (!response) {
      throw createValidationError({ isValid: false, errors: ['Empty API response'] });
    }

    try {
      return transformCurrentWeather(response as OpenWeatherCurrentResponse);
    } catch (error) {
      throw createValidationError({
        isValid: false,
        errors: [error instanceof Error ? error.message : 'Unknown validation error'],
      });
    }
  }

  /**
   * Validates forecast API response and transforms to application format
   */
  static validateAndTransformForecast(response: unknown): ForecastData[] {
    if (!response) {
      throw createValidationError({ isValid: false, errors: ['Empty forecast response'] });
    }

    try {
      return transformForecastData(response as OpenWeatherForecastResponse);
    } catch (error) {
      throw createValidationError({
        isValid: false,
        errors: [error instanceof Error ? error.message : 'Unknown validation error'],
      });
    }
  }

  /**
   * Validates temperature conversion input
   */
  static validateTemperatureConversion(temperature: number, fromUnit: string, toUnit: string): ValidationResult {
    const errors: string[] = [];

    const tempValidation = validateTemperature(temperature);
    if (!tempValidation.isValid) {
      errors.push(...tempValidation.errors);
    }

    const validUnits = ['celsius', 'fahrenheit', 'kelvin'];
    if (!validUnits.includes(fromUnit.toLowerCase())) {
      errors.push(`Invalid source unit: ${fromUnit}`);
    }

    if (!validUnits.includes(toUnit.toLowerCase())) {
      errors.push(`Invalid target unit: ${toUnit}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}