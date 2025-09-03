import { describe, it, expect } from 'vitest';
import {
  sanitizeCityName,
  sanitizeTemperature,
  sanitizeString,
  validateCityName,
  validateTemperature,
  temperatureConversions,
  validateCurrentWeatherResponse,
  validateForecastResponse,
  transformCurrentWeather,
  transformForecastData,
  createValidationError,
  ValidationService,
} from './validation';
import type { OpenWeatherCurrentResponse, OpenWeatherForecastResponse } from '@/types';

describe('Input Sanitization', () => {
  describe('sanitizeCityName', () => {
    it('should sanitize basic city names correctly', () => {
      expect(sanitizeCityName('London')).toBe('London');
      expect(sanitizeCityName('New York')).toBe('New York');
      expect(sanitizeCityName('  Paris  ')).toBe('Paris');
    });

    it('should remove dangerous characters', () => {
      expect(sanitizeCityName('London<script>')).toBe('London');
      expect(sanitizeCityName('City"Name')).toBe('CityName');
      expect(sanitizeCityName("City'Name")).toBe('CityName');
      expect(sanitizeCityName('City&Name')).toBe('CityName');
    });

    it('should normalize whitespace', () => {
      expect(sanitizeCityName('New    York')).toBe('New York');
      expect(sanitizeCityName('  Multiple   Spaces  ')).toBe('Multiple Spaces');
    });

    it('should enforce max length', () => {
      const longName = 'A'.repeat(100);
      expect(sanitizeCityName(longName)).toHaveLength(50);
    });

    it('should handle non-string input', () => {
      expect(sanitizeCityName(123 as any)).toBe('');
      expect(sanitizeCityName(null as any)).toBe('');
      expect(sanitizeCityName(undefined as any)).toBe('');
    });
  });

  describe('sanitizeTemperature', () => {
    it('should handle valid numbers', () => {
      expect(sanitizeTemperature(25.5)).toBe(25.5);
      expect(sanitizeTemperature(-10)).toBe(-10);
      expect(sanitizeTemperature(0)).toBe(0);
    });

    it('should handle string numbers', () => {
      expect(sanitizeTemperature('25.5')).toBe(25.5);
      expect(sanitizeTemperature(' -10 ')).toBe(-10);
    });

    it('should round to 2 decimal places', () => {
      expect(sanitizeTemperature(25.123456)).toBe(25.12);
      expect(sanitizeTemperature(25.999)).toBe(26);
    });

    it('should return null for invalid input', () => {
      expect(sanitizeTemperature('invalid')).toBeNull();
      expect(sanitizeTemperature(NaN)).toBeNull();
      expect(sanitizeTemperature(Infinity)).toBeNull();
      expect(sanitizeTemperature({})).toBeNull();
    });
  });

  describe('sanitizeString', () => {
    it('should sanitize strings correctly', () => {
      expect(sanitizeString('Hello World')).toBe('Hello World');
      expect(sanitizeString('  Trimmed  ')).toBe('Trimmed');
    });

    it('should remove dangerous characters', () => {
      expect(sanitizeString('Hello<script>alert("xss")</script>')).toBe('Helloscriptalert(xss)/script');
      expect(sanitizeString('Test"Quote')).toBe('TestQuote');
    });

    it('should enforce max length', () => {
      expect(sanitizeString('A'.repeat(200), 10)).toHaveLength(10);
    });

    it('should handle non-string input', () => {
      expect(sanitizeString(123)).toBe('');
      expect(sanitizeString(null)).toBe('');
    });
  });
});

describe('City Name Validation', () => {
  describe('validateCityName', () => {
    it('should validate correct city names', () => {
      const result = validateCityName('London');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate city names with spaces and hyphens', () => {
      expect(validateCityName('New York').isValid).toBe(true);
      expect(validateCityName('Saint-Denis').isValid).toBe(true);
      expect(validateCityName("O'Connor").isValid).toBe(true);
    });

    it('should reject empty city names', () => {
      const result = validateCityName('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('City name is required');
    });

    it('should reject city names that are too short', () => {
      const result = validateCityName('A');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('at least 2 characters');
    });

    it('should reject city names that are too long', () => {
      const result = validateCityName('A'.repeat(60));
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('must not exceed 50 characters');
    });

    it('should reject city names with numbers', () => {
      const result = validateCityName('City123');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('letters, spaces, hyphens, and apostrophes');
    });

    it('should reject city names with special characters', () => {
      const result = validateCityName('City@Name');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('letters, spaces, hyphens, and apostrophes');
    });

    it('should detect injection patterns', () => {
      const result = validateCityName('<script>alert("xss")</script>');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid characters detected in city name');
    });
  });
});

describe('Temperature Validation', () => {
  describe('validateTemperature', () => {
    it('should validate normal temperatures', () => {
      expect(validateTemperature(25).isValid).toBe(true);
      expect(validateTemperature(-10).isValid).toBe(true);
      expect(validateTemperature(0).isValid).toBe(true);
    });

    it('should reject non-numeric temperatures', () => {
      const result = validateTemperature('invalid');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Temperature must be a valid number');
    });

    it('should reject temperatures outside valid range', () => {
      const tooLow = validateTemperature(-150);
      expect(tooLow.isValid).toBe(false);
      expect(tooLow.errors[0]).toContain('cannot be below -100°C');

      const tooHigh = validateTemperature(100);
      expect(tooHigh.isValid).toBe(false);
      expect(tooHigh.errors[0]).toContain('cannot be above 60°C');
    });
  });

  describe('temperatureConversions', () => {
    it('should convert Celsius to Fahrenheit correctly', () => {
      expect(temperatureConversions.celsiusToFahrenheit(0)).toBe(32);
      expect(temperatureConversions.celsiusToFahrenheit(25)).toBe(77);
      expect(temperatureConversions.celsiusToFahrenheit(-10)).toBe(14);
    });

    it('should convert Fahrenheit to Celsius correctly', () => {
      expect(temperatureConversions.fahrenheitToCelsius(32)).toBe(0);
      expect(temperatureConversions.fahrenheitToCelsius(77)).toBe(25);
      expect(temperatureConversions.fahrenheitToCelsius(14)).toBe(-10);
    });

    it('should convert Kelvin to Celsius correctly', () => {
      expect(temperatureConversions.kelvinToCelsius(273.15)).toBe(0);
      expect(temperatureConversions.kelvinToCelsius(298.15)).toBe(25);
    });

    it('should throw error for invalid temperatures', () => {
      expect(() => temperatureConversions.celsiusToFahrenheit(-150)).toThrow();
      expect(() => temperatureConversions.fahrenheitToCelsius(200)).toThrow();
    });
  });
});

describe('API Response Validation', () => {
  describe('validateCurrentWeatherResponse', () => {
    const validResponse: OpenWeatherCurrentResponse = {
      name: 'London',
      main: {
        temp: 25.5,
        humidity: 60,
      },
      weather: [
        {
          main: 'Clear',
          description: 'clear sky',
          icon: '01d',
        },
      ],
      wind: {
        speed: 5.2,
      },
      dt: 1640995200,
    };

    it('should validate correct API response', () => {
      const result = validateCurrentWeatherResponse(validResponse);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject null or undefined response', () => {
      expect(validateCurrentWeatherResponse(null).isValid).toBe(false);
      expect(validateCurrentWeatherResponse(undefined).isValid).toBe(false);
    });

    it('should reject response missing required fields', () => {
      const invalidResponse = { ...validResponse };
      delete (invalidResponse as any).name;
      
      const result = validateCurrentWeatherResponse(invalidResponse);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing required field: name');
    });

    it('should reject invalid temperature', () => {
      const invalidResponse = {
        ...validResponse,
        main: { ...validResponse.main, temp: 'invalid' },
      };
      
      const result = validateCurrentWeatherResponse(invalidResponse);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Invalid temperature');
    });

    it('should reject invalid humidity', () => {
      const invalidResponse = {
        ...validResponse,
        main: { ...validResponse.main, humidity: 150 },
      };
      
      const result = validateCurrentWeatherResponse(invalidResponse);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Humidity must be between 0 and 100');
    });

    it('should reject empty weather array', () => {
      const invalidResponse = {
        ...validResponse,
        weather: [],
      };
      
      const result = validateCurrentWeatherResponse(invalidResponse);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Weather conditions array cannot be empty');
    });
  });

  describe('validateForecastResponse', () => {
    const validForecastResponse: OpenWeatherForecastResponse = {
      list: [
        {
          dt: 1640995200,
          main: {
            temp_max: 25,
            temp_min: 15,
          },
          weather: [
            {
              main: 'Rain',
              description: 'light rain',
              icon: '10d',
            },
          ],
          pop: 0.3,
        },
      ],
    };

    it('should validate correct forecast response', () => {
      const result = validateForecastResponse(validForecastResponse);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject response without list', () => {
      const result = validateForecastResponse({});
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Forecast list is required and must be an array');
    });

    it('should reject empty forecast list', () => {
      const result = validateForecastResponse({ list: [] });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Forecast list cannot be empty');
    });

    it('should reject invalid forecast item', () => {
      const invalidResponse = {
        list: [{ invalid: 'data' }],
      };
      
      const result = validateForecastResponse(invalidResponse);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Missing or invalid timestamp');
    });
  });
});

describe('Data Transformation', () => {
  describe('transformCurrentWeather', () => {
    const validResponse: OpenWeatherCurrentResponse = {
      name: 'London',
      main: {
        temp: 25.5,
        humidity: 60,
      },
      weather: [
        {
          main: 'Clear',
          description: 'clear sky',
          icon: '01d',
        },
      ],
      wind: {
        speed: 5.2,
      },
      dt: 1640995200,
    };

    it('should transform valid response correctly', () => {
      const result = transformCurrentWeather(validResponse);
      
      expect(result.city).toBe('London');
      expect(result.temperature).toBe(25.5);
      expect(result.condition.main).toBe('Clear');
      expect(result.condition.description).toBe('clear sky');
      expect(result.condition.icon).toBe('01d');
      expect(result.humidity).toBe(60);
      expect(result.windSpeed).toBe(5.2);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should throw error for invalid response', () => {
      const invalidResponse = { ...validResponse };
      delete (invalidResponse as any).name;
      
      expect(() => transformCurrentWeather(invalidResponse)).toThrow('Invalid weather data');
    });
  });

  describe('transformForecastData', () => {
    const validResponse: OpenWeatherForecastResponse = {
      list: [
        {
          dt: 1640995200,
          main: {
            temp_max: 25,
            temp_min: 15,
          },
          weather: [
            {
              main: 'Rain',
              description: 'light rain',
              icon: '10d',
            },
          ],
          pop: 0.3,
        },
      ],
    };

    it('should transform valid forecast response correctly', () => {
      const result = transformForecastData(validResponse);
      
      expect(result).toHaveLength(1);
      expect(result[0]?.highTemp).toBe(25);
      expect(result[0]?.lowTemp).toBe(15);
      expect(result[0]?.condition.main).toBe('Rain');
      expect(result[0]?.precipitationChance).toBe(0.3);
      expect(result[0]?.date).toBeInstanceOf(Date);
    });

    it('should limit to 5 forecast items', () => {
      const responseWith10Items = {
        list: Array(10).fill(validResponse.list[0]),
      };
      
      const result = transformForecastData(responseWith10Items);
      expect(result).toHaveLength(5);
    });
  });
});

describe('ValidationService', () => {
  describe('validateCityInput', () => {
    it('should validate and sanitize city input', () => {
      const result = ValidationService.validateCityInput('  London  ');
      
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('London');
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for invalid input', () => {
      const result = ValidationService.validateCityInput('123');
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateTemperatureConversion', () => {
    it('should validate correct temperature conversion', () => {
      const result = ValidationService.validateTemperatureConversion(25, 'celsius', 'fahrenheit');
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid temperature', () => {
      const result = ValidationService.validateTemperatureConversion(-150, 'celsius', 'fahrenheit');
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('cannot be below');
    });

    it('should reject invalid units', () => {
      const result = ValidationService.validateTemperatureConversion(25, 'invalid', 'fahrenheit');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid source unit: invalid');
    });
  });
});

describe('Error Creation', () => {
  describe('createValidationError', () => {
    it('should create WeatherError from ValidationResult', () => {
      const validationResult = {
        isValid: false,
        errors: ['Error 1', 'Error 2'],
      };
      
      const error = createValidationError(validationResult);
      
      expect(error.type).toBe('validation');
      expect(error.message).toBe('Error 1; Error 2');
      expect(error.retryable).toBe(false);
      expect(error.details).toContain('2 error(s)');
    });

    it('should allow custom error type', () => {
      const validationResult = {
        isValid: false,
        errors: ['Network error'],
      };
      
      const error = createValidationError(validationResult, 'network');
      
      expect(error.type).toBe('network');
      expect(error.retryable).toBe(true);
    });
  });
});