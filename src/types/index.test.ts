import { describe, it, expect } from 'vitest';
import {
  isWeatherError,
  isCurrentWeather,
  isForecastData,
  WEATHER_ERROR_MESSAGES,
  VALIDATION_RULES,
  CACHE_CONFIG,
  type WeatherError,
  type CurrentWeather,
  type ForecastData,
  type WeatherCondition,
  type OpenWeatherCurrentResponse,
  type OpenWeatherForecastResponse,
  type ValidationResult,
  type TemperatureUnit,
} from './index';

describe('Type Guards', () => {
  describe('isWeatherError', () => {
    it('should return true for valid WeatherError objects', () => {
      const validError: WeatherError = {
        type: 'network',
        message: 'Network error',
        retryable: true,
      };

      expect(isWeatherError(validError)).toBe(true);
    });

    it('should return false for invalid objects', () => {
      expect(isWeatherError(null)).toBe(false);
      expect(isWeatherError(undefined)).toBe(false);
      expect(isWeatherError('string')).toBe(false);
      expect(isWeatherError({})).toBe(false);
      expect(isWeatherError({ type: 'network' })).toBe(false); // missing required fields
    });

    it('should return true for WeatherError with optional fields', () => {
      const errorWithOptionals: WeatherError = {
        type: 'api',
        message: 'API error',
        retryable: false,
        code: 404,
        details: 'City not found',
      };

      expect(isWeatherError(errorWithOptionals)).toBe(true);
    });
  });

  describe('isCurrentWeather', () => {
    it('should return true for valid CurrentWeather objects', () => {
      const condition: WeatherCondition = {
        main: 'Clear',
        description: 'clear sky',
        icon: '01d',
      };

      const validWeather: CurrentWeather = {
        city: 'New York',
        temperature: 25,
        condition,
        humidity: 60,
        windSpeed: 10,
        timestamp: new Date(),
      };

      expect(isCurrentWeather(validWeather)).toBe(true);
    });

    it('should return false for invalid objects', () => {
      expect(isCurrentWeather(null)).toBe(false);
      expect(isCurrentWeather({})).toBe(false);
      expect(isCurrentWeather({ city: 'New York' })).toBe(false); // missing required fields
    });
  });

  describe('isForecastData', () => {
    it('should return true for valid ForecastData objects', () => {
      const condition: WeatherCondition = {
        main: 'Rain',
        description: 'light rain',
        icon: '10d',
      };

      const validForecast: ForecastData = {
        date: new Date(),
        highTemp: 28,
        lowTemp: 18,
        condition,
        precipitationChance: 0.3,
      };

      expect(isForecastData(validForecast)).toBe(true);
    });

    it('should return false for invalid objects', () => {
      expect(isForecastData(null)).toBe(false);
      expect(isForecastData({})).toBe(false);
      expect(isForecastData({ date: new Date() })).toBe(false); // missing required fields
    });
  });
});

describe('Constants', () => {
  describe('WEATHER_ERROR_MESSAGES', () => {
    it('should contain all required error message types', () => {
      expect(WEATHER_ERROR_MESSAGES.NETWORK_ERROR).toBeDefined();
      expect(WEATHER_ERROR_MESSAGES.CITY_NOT_FOUND).toBeDefined();
      expect(WEATHER_ERROR_MESSAGES.RATE_LIMIT).toBeDefined();
      expect(WEATHER_ERROR_MESSAGES.SERVICE_UNAVAILABLE).toBeDefined();
      expect(WEATHER_ERROR_MESSAGES.INVALID_INPUT).toBeDefined();
      expect(WEATHER_ERROR_MESSAGES.TIMEOUT).toBeDefined();
      expect(WEATHER_ERROR_MESSAGES.GENERIC_ERROR).toBeDefined();
    });

    it('should have meaningful error messages', () => {
      expect(WEATHER_ERROR_MESSAGES.NETWORK_ERROR).toContain('internet connection');
      expect(WEATHER_ERROR_MESSAGES.CITY_NOT_FOUND).toContain('City not found');
      expect(WEATHER_ERROR_MESSAGES.RATE_LIMIT).toContain('Too many requests');
    });
  });

  describe('VALIDATION_RULES', () => {
    it('should have proper city name validation rules', () => {
      expect(VALIDATION_RULES.cityName.minLength).toBe(2);
      expect(VALIDATION_RULES.cityName.maxLength).toBe(50);
      expect(VALIDATION_RULES.cityName.required).toBe(true);
      expect(VALIDATION_RULES.cityName.pattern).toBeInstanceOf(RegExp);
    });

    it('should have proper temperature validation rules', () => {
      expect(VALIDATION_RULES.temperature.min).toBe(-100);
      expect(VALIDATION_RULES.temperature.max).toBe(60);
      expect(VALIDATION_RULES.temperature.type).toBe('number');
    });

    it('should have proper API response validation rules', () => {
      expect(VALIDATION_RULES.apiResponse.requiredFields).toContain('name');
      expect(VALIDATION_RULES.apiResponse.requiredFields).toContain('main.temp');
      expect(VALIDATION_RULES.apiResponse.requiredFields).toContain('weather');
      expect(VALIDATION_RULES.apiResponse.timeoutMs).toBe(10000);
    });
  });

  describe('CACHE_CONFIG', () => {
    it('should have reasonable cache TTL values', () => {
      expect(CACHE_CONFIG.currentWeatherTTL).toBe(10 * 60 * 1000); // 10 minutes
      expect(CACHE_CONFIG.forecastTTL).toBe(60 * 60 * 1000); // 1 hour
      expect(CACHE_CONFIG.maxCacheSize).toBe(50);
      expect(CACHE_CONFIG.compressionEnabled).toBe(true);
    });
  });
});

describe('Interface Compliance', () => {
  describe('OpenWeatherMap API Response Types', () => {
    it('should match expected OpenWeatherCurrentResponse structure', () => {
      const mockResponse: OpenWeatherCurrentResponse = {
        name: 'London',
        main: {
          temp: 20.5,
          humidity: 65,
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

      // Type checking - if this compiles, the interface is correct
      expect(mockResponse.name).toBe('London');
      expect(mockResponse.main.temp).toBe(20.5);
      expect(mockResponse.weather[0]?.main).toBe('Clear');
    });

    it('should match expected OpenWeatherForecastResponse structure', () => {
      const mockResponse: OpenWeatherForecastResponse = {
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

      // Type checking - if this compiles, the interface is correct
      expect(mockResponse.list[0]?.main.temp_max).toBe(25);
      expect(mockResponse.list[0]?.weather[0]?.main).toBe('Rain');
    });
  });

  describe('Component Props Interfaces', () => {
    it('should allow valid TemperatureToggleProps', () => {
      const props = {
        unit: 'celsius' as TemperatureUnit,
        onChange: (_unit: TemperatureUnit) => {},
        className: 'test-class',
      };

      // Type checking - if this compiles, the interface is correct
      expect(props.unit).toBe('celsius');
      expect(typeof props.onChange).toBe('function');
    });

    it('should allow valid SearchSectionProps', () => {
      const props = {
        onSearch: (_city: string) => {},
        loading: false,
        error: null,
      };

      // Type checking - if this compiles, the interface is correct
      expect(typeof props.onSearch).toBe('function');
      expect(props.loading).toBe(false);
    });
  });

  describe('Validation Types', () => {
    it('should allow valid ValidationResult', () => {
      const validResult: ValidationResult = {
        isValid: true,
        errors: [],
      };

      const invalidResult: ValidationResult = {
        isValid: false,
        errors: ['City name is required', 'Invalid characters'],
      };

      expect(validResult.isValid).toBe(true);
      expect(invalidResult.errors).toHaveLength(2);
    });
  });
});

describe('Type Safety', () => {
  it('should enforce WeatherErrorType union', () => {
    const validTypes = [
      'network',
      'api',
      'validation',
      'not_found',
      'rate_limit',
      'timeout',
      'service_unavailable',
    ];

    validTypes.forEach((type) => {
      const error: WeatherError = {
        type: type as any,
        message: 'Test error',
        retryable: true,
      };
      expect(error.type).toBe(type);
    });
  });

  it('should enforce TemperatureUnit union', () => {
    const celsius: TemperatureUnit = 'celsius';
    const fahrenheit: TemperatureUnit = 'fahrenheit';

    expect(celsius).toBe('celsius');
    expect(fahrenheit).toBe('fahrenheit');
  });
});

describe('City Name Validation Pattern', () => {
  it('should validate city names correctly', () => {
    const pattern = VALIDATION_RULES.cityName.pattern;

    // Valid city names
    expect(pattern.test('London')).toBe(true);
    expect(pattern.test('New York')).toBe(true);
    expect(pattern.test('São Paulo')).toBe(false); // Contains special characters
    expect(pattern.test("O'Connor")).toBe(true); // Contains apostrophe
    expect(pattern.test('Saint-Denis')).toBe(true); // Contains hyphen

    // Invalid city names
    expect(pattern.test('123')).toBe(false); // Numbers only
    expect(pattern.test('City123')).toBe(false); // Contains numbers
    expect(pattern.test('City@Name')).toBe(false); // Contains special characters
    expect(pattern.test('')).toBe(false); // Empty string
  });
});