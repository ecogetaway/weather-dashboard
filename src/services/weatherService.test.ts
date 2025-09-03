import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WeatherService } from './weatherService';
import type { Location } from '@/types';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('WeatherService', () => {
  let weatherService: WeatherService;
  const mockLocation: Location = {
    id: '123',
    name: 'London',
    country: 'GB',
    lat: 51.5074,
    lon: -0.1278
  };

  beforeEach(() => {
    weatherService = new WeatherService({
      apiKey: 'test-api-key',
      timeout: 5000,
      maxRetries: 2
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('searchLocations', () => {
    it('should return empty array for short queries', async () => {
      const result = await weatherService.searchLocations('a');
      expect(result).toEqual([]);
    });

    it('should return empty array for empty queries', async () => {
      const result = await weatherService.searchLocations('');
      expect(result).toEqual([]);
    });

    it('should return locations for valid queries', async () => {
      const mockResponse = {
        list: [
          {
            id: 123,
            name: 'London',
            sys: { country: 'GB' },
            coord: { lat: 51.5074, lon: -0.1278 }
          }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await weatherService.searchLocations('London');
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: '123',
        name: 'London',
        country: 'GB',
        lat: 51.5074,
        lon: -0.1278
      });
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await weatherService.searchLocations('London');
      expect(result).toEqual([]);
    });
  });

  describe('getCurrentWeather', () => {
    it('should fetch and transform current weather data', async () => {
      const mockResponse = {
        main: {
          temp: 20,
          humidity: 65
        },
        wind: {
          speed: 5.5
        },
        weather: [
          {
            description: 'clear sky',
            icon: '01d'
          }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await weatherService.getCurrentWeather(mockLocation);

      expect(result).toMatchObject({
        location: mockLocation,
        temperature: {
          celsius: 20,
          fahrenheit: 68
        },
        humidity: 65,
        windSpeed: 20, // 5.5 m/s * 3.6 = 19.8, rounded to 20
        description: 'clear sky',
        icon: '01d'
      });
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should handle API errors', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Headers(),
        json: () => Promise.resolve({ message: 'Location not found' }),
        text: () => Promise.resolve('Not Found'),
        blob: () => Promise.resolve(new Blob()),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        formData: () => Promise.resolve(new FormData()),
        clone: () => mockResponse,
        body: null,
        bodyUsed: false,
        redirected: false,
        type: 'basic' as ResponseType,
        url: 'https://api.test.com'
      } as Response;
      
      mockFetch.mockResolvedValueOnce(mockResponse);

      await expect(weatherService.getCurrentWeather(mockLocation))
        .rejects
        .toMatchObject({
          type: 'not_found',
          message: 'Location not found',
          retryable: false
        });
    });

    it('should handle network errors', async () => {
      const networkError = new Error('fetch failed');
      mockFetch.mockRejectedValueOnce(networkError);

      await expect(weatherService.getCurrentWeather(mockLocation))
        .rejects
        .toMatchObject({
          type: 'network',
          message: 'Network connection failed',
          retryable: true
        });
    });

    it('should handle timeout errors', async () => {
      // Mock AbortError
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValueOnce(abortError);

      await expect(weatherService.getCurrentWeather(mockLocation))
        .rejects
        .toMatchObject({
          type: 'timeout',
          message: 'Request timed out',
          retryable: true
        });
    });
  });

  describe('getForecast', () => {
    it('should fetch and transform forecast data', async () => {
      const mockResponse = {
        list: [
          {
            dt: 1640995200, // 2022-01-01 00:00:00
            main: {
              temp_max: 15,
              temp_min: 5
            },
            weather: [
              {
                description: 'light rain',
                icon: '10d'
              }
            ]
          },
          {
            dt: 1641081600, // 2022-01-02 00:00:00
            main: {
              temp_max: 18,
              temp_min: 8
            },
            weather: [
              {
                description: 'cloudy',
                icon: '04d'
              }
            ]
          }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await weatherService.getForecast(mockLocation, 5);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        highTemp: 15,
        lowTemp: 5,
        description: 'light rain',
        icon: '10d'
      });
      expect(result[0].date).toBeInstanceOf(Date);
    });

    it('should handle forecast API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Internal server error' })
      });

      await expect(weatherService.getForecast(mockLocation))
        .rejects
        .toMatchObject({
          type: 'service_unavailable',
          retryable: true
        });
    });
  });

  describe('retry logic', () => {
    it('should retry on retryable errors', async () => {
      // First call fails, second succeeds
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            main: { temp: 20, humidity: 65 },
            wind: { speed: 5.5 },
            weather: [{ description: 'clear sky', icon: '01d' }]
          })
        });

      const result = await weatherService.getCurrentWeather(mockLocation);
      
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.temperature.celsius).toBe(20);
    });

    it('should not retry on non-retryable errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Invalid API key' })
      });

      await expect(weatherService.getCurrentWeather(mockLocation))
        .rejects
        .toMatchObject({
          type: 'api',
          retryable: false
        });

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should respect max retry limit', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(weatherService.getCurrentWeather(mockLocation))
        .rejects
        .toThrow('Network error');

      // Should be called 3 times: initial + 2 retries
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('error handling', () => {
    it('should handle 401 unauthorized errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Invalid API key' })
      });

      await expect(weatherService.getCurrentWeather(mockLocation))
        .rejects
        .toMatchObject({
          type: 'api',
          message: 'Invalid API key',
          retryable: false,
          code: 401
        });
    });

    it('should handle 429 rate limit errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: () => Promise.resolve({})
      });

      await expect(weatherService.getCurrentWeather(mockLocation))
        .rejects
        .toMatchObject({
          type: 'rate_limit',
          message: 'Too many requests. Please try again later.',
          retryable: true
        });
    });
  });

  describe('configuration validation', () => {
    it('should validate configuration correctly', () => {
      const validService = new WeatherService({
        apiKey: 'test-key',
        baseUrl: 'https://api.test.com'
      });
      expect(validService.validateConfig()).toBe(true);

      const invalidService = new WeatherService({
        apiKey: '',
        baseUrl: 'https://api.test.com'
      });
      expect(invalidService.validateConfig()).toBe(false);
    });
  });

  describe('health check', () => {
    it('should return healthy status on successful request', async () => {
      vi.useFakeTimers();
      const startTime = Date.now();
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({})
      });

      // Advance time to simulate response time
      vi.advanceTimersByTime(100);
      
      const health = await weatherService.getHealthStatus();
      
      expect(health.healthy).toBe(true);
      expect(health.responseTime).toBeGreaterThanOrEqual(0);
      
      vi.useRealTimers();
    });

    it('should return unhealthy status on failed request', async () => {
      vi.useFakeTimers();
      
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // Advance time to simulate response time
      vi.advanceTimersByTime(100);
      
      const health = await weatherService.getHealthStatus();
      
      expect(health.healthy).toBe(false);
      expect(health.responseTime).toBeGreaterThanOrEqual(0);
      
      vi.useRealTimers();
    });
  });
});