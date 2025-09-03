import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WeatherService } from './weatherService';
import { offlineService } from './offlineService';
import type { Location, CurrentWeather, ForecastDay } from '@/types';

// Mock the offline service
vi.mock('./offlineService', () => ({
  offlineService: {
    getCachedWeatherData: vi.fn(),
    cacheWeatherData: vi.fn(),
    addToOfflineQueue: vi.fn(),
    getOfflineQueue: vi.fn(),
    removeFromOfflineQueue: vi.fn(),
    incrementRetryCount: vi.fn(),
    hasCachedData: vi.fn(),
    getCacheAge: vi.fn(),
    clearCache: vi.fn(),
    getCacheStats: vi.fn()
  }
}));

// Mock fetch
global.fetch = vi.fn();

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

describe('WeatherService - Offline Functionality', () => {
  let weatherService: WeatherService;
  
  const mockLocation: Location = {
    id: 'test-location',
    name: 'Test City',
    country: 'TC',
    lat: 40.7128,
    lon: -74.0060,
  };

  const mockCurrentWeather: CurrentWeather = {
    location: 'Test City',
    temperature: { celsius: 20, fahrenheit: 68 },
    description: 'Clear sky',
    icon: '01d',
    humidity: 65,
    windSpeed: 5.2,
    pressure: 1013,
    visibility: 10,
    uvIndex: 3,
    timestamp: new Date(),
  };

  const mockForecast: ForecastDay[] = [
    {
      date: new Date(),
      temperature: { min: 15, max: 25 },
      description: 'Sunny',
      icon: '01d',
      humidity: 60,
      windSpeed: 4.5,
      precipitation: 0,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    navigator.onLine = true;
    weatherService = new WeatherService({ apiKey: 'test-api-key' });
    
    // Mock successful API responses
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        name: 'Test City',
        main: { temp: 20, humidity: 65, pressure: 1013 },
        weather: [{ description: 'Clear sky', icon: '01d' }],
        wind: { speed: 5.2 },
        visibility: 10000,
        dt: Date.now() / 1000
      })
    } as Response);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getCurrentWeatherOffline', () => {
    it('fetches and caches weather data when online', async () => {
      const result = await weatherService.getCurrentWeatherOffline(mockLocation);
      
      expect(fetch).toHaveBeenCalled();
      expect(offlineService.cacheWeatherData).toHaveBeenCalledWith(
        mockLocation,
        expect.any(Object),
        expect.any(Array)
      );
      expect(result).toBeDefined();
    });

    it('returns cached data when offline', async () => {
      navigator.onLine = false;
      vi.mocked(offlineService.getCachedWeatherData).mockReturnValue({
        location: mockLocation,
        currentWeather: mockCurrentWeather,
        forecast: mockForecast,
        timestamp: Date.now(),
        expiresAt: Date.now() + 30 * 60 * 1000
      });

      const result = await weatherService.getCurrentWeatherOffline(mockLocation);
      
      expect(fetch).not.toHaveBeenCalled();
      expect(result).toEqual(mockCurrentWeather);
    });

    it('adds to offline queue when offline and no cached data', async () => {
      navigator.onLine = false;
      vi.mocked(offlineService.getCachedWeatherData).mockReturnValue(null);

      await expect(weatherService.getCurrentWeatherOffline(mockLocation))
        .rejects.toThrow('No cached weather data available');
      
      expect(offlineService.addToOfflineQueue).toHaveBeenCalledWith('weather', mockLocation);
    });

    it('falls back to cached data when API fails', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));
      vi.mocked(offlineService.getCachedWeatherData).mockReturnValue({
        location: mockLocation,
        currentWeather: mockCurrentWeather,
        forecast: mockForecast,
        timestamp: Date.now(),
        expiresAt: Date.now() + 30 * 60 * 1000
      });

      const result = await weatherService.getCurrentWeatherOffline(mockLocation);
      
      expect(result).toEqual(mockCurrentWeather);
      expect(offlineService.addToOfflineQueue).toHaveBeenCalledWith('weather', mockLocation);
    });

    it('throws error when API fails and no cached data', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));
      vi.mocked(offlineService.getCachedWeatherData).mockReturnValue(null);

      await expect(weatherService.getCurrentWeatherOffline(mockLocation))
        .rejects.toThrow('Network error');
      
      expect(offlineService.addToOfflineQueue).toHaveBeenCalledWith('weather', mockLocation);
    });
  });

  describe('getForecastOffline', () => {
    beforeEach(() => {
      // Mock forecast API response
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          list: [
            {
              dt: Date.now() / 1000,
              main: { temp_min: 15, temp_max: 25, humidity: 60 },
              weather: [{ description: 'Sunny', icon: '01d' }],
              wind: { speed: 4.5 },
              pop: 0
            }
          ]
        })
      } as Response);
    });

    it('fetches and caches forecast data when online', async () => {
      const result = await weatherService.getForecastOffline(mockLocation, 5);
      
      expect(fetch).toHaveBeenCalled();
      expect(offlineService.cacheWeatherData).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('returns cached forecast when offline', async () => {
      navigator.onLine = false;
      vi.mocked(offlineService.getCachedWeatherData).mockReturnValue({
        location: mockLocation,
        currentWeather: mockCurrentWeather,
        forecast: mockForecast,
        timestamp: Date.now(),
        expiresAt: Date.now() + 30 * 60 * 1000
      });

      const result = await weatherService.getForecastOffline(mockLocation, 5);
      
      expect(fetch).not.toHaveBeenCalled();
      expect(result).toEqual(mockForecast);
    });

    it('limits forecast results to requested days', async () => {
      navigator.onLine = false;
      const extendedForecast = [
        ...mockForecast,
        { ...mockForecast[0], date: new Date(Date.now() + 86400000) },
        { ...mockForecast[0], date: new Date(Date.now() + 172800000) }
      ];
      
      vi.mocked(offlineService.getCachedWeatherData).mockReturnValue({
        location: mockLocation,
        currentWeather: mockCurrentWeather,
        forecast: extendedForecast,
        timestamp: Date.now(),
        expiresAt: Date.now() + 30 * 60 * 1000
      });

      const result = await weatherService.getForecastOffline(mockLocation, 2);
      
      expect(result).toHaveLength(2);
    });

    it('adds to offline queue when offline and no cached data', async () => {
      navigator.onLine = false;
      vi.mocked(offlineService.getCachedWeatherData).mockReturnValue(null);

      await expect(weatherService.getForecastOffline(mockLocation, 5))
        .rejects.toThrow('No cached forecast data available');
      
      expect(offlineService.addToOfflineQueue).toHaveBeenCalledWith('forecast', mockLocation);
    });
  });

  describe('searchLocationsOffline', () => {
    it('performs search when online', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([
          { name: 'Test City', country: 'TC', lat: 40.7128, lon: -74.0060 }
        ])
      } as Response);

      const result = await weatherService.searchLocationsOffline('test');
      
      expect(fetch).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });

    it('returns empty array when offline', async () => {
      navigator.onLine = false;
      
      const result = await weatherService.searchLocationsOffline('test');
      
      expect(fetch).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('processOfflineQueue', () => {
    it('processes weather queue items successfully', async () => {
      const queueItems = [
        {
          id: 'weather-test-1',
          type: 'weather' as const,
          location: mockLocation,
          timestamp: Date.now(),
          retryCount: 0
        }
      ];
      
      vi.mocked(offlineService.getOfflineQueue).mockReturnValue(queueItems);

      const result = await weatherService.processOfflineQueue();
      
      expect(result.processed).toBe(1);
      expect(result.failed).toBe(0);
      expect(offlineService.removeFromOfflineQueue).toHaveBeenCalledWith('weather-test-1');
    });

    it('processes forecast queue items successfully', async () => {
      const queueItems = [
        {
          id: 'forecast-test-1',
          type: 'forecast' as const,
          location: mockLocation,
          timestamp: Date.now(),
          retryCount: 0
        }
      ];
      
      vi.mocked(offlineService.getOfflineQueue).mockReturnValue(queueItems);

      const result = await weatherService.processOfflineQueue();
      
      expect(result.processed).toBe(1);
      expect(result.failed).toBe(0);
      expect(offlineService.removeFromOfflineQueue).toHaveBeenCalledWith('forecast-test-1');
    });

    it('handles failed queue items with retry logic', async () => {
      const queueItems = [
        {
          id: 'weather-test-1',
          type: 'weather' as const,
          location: mockLocation,
          timestamp: Date.now(),
          retryCount: 0
        }
      ];
      
      vi.mocked(offlineService.getOfflineQueue).mockReturnValue(queueItems);
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));
      vi.mocked(offlineService.incrementRetryCount).mockReturnValue(true);

      const result = await weatherService.processOfflineQueue();
      
      expect(result.processed).toBe(0);
      expect(result.failed).toBe(0); // Not failed yet, will retry
      expect(offlineService.incrementRetryCount).toHaveBeenCalledWith('weather-test-1');
    });

    it('marks items as failed when max retries exceeded', async () => {
      const queueItems = [
        {
          id: 'weather-test-1',
          type: 'weather' as const,
          location: mockLocation,
          timestamp: Date.now(),
          retryCount: 2
        }
      ];
      
      vi.mocked(offlineService.getOfflineQueue).mockReturnValue(queueItems);
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));
      vi.mocked(offlineService.incrementRetryCount).mockReturnValue(false); // Max retries exceeded

      const result = await weatherService.processOfflineQueue();
      
      expect(result.processed).toBe(0);
      expect(result.failed).toBe(1);
    });

    it('returns empty results for empty queue', async () => {
      vi.mocked(offlineService.getOfflineQueue).mockReturnValue([]);

      const result = await weatherService.processOfflineQueue();
      
      expect(result.processed).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.results).toEqual([]);
    });
  });

  describe('cache management methods', () => {
    it('delegates getCachedWeatherData to offline service', () => {
      const mockCachedData = {
        location: mockLocation,
        currentWeather: mockCurrentWeather,
        forecast: mockForecast,
        timestamp: Date.now(),
        expiresAt: Date.now() + 30 * 60 * 1000
      };
      
      vi.mocked(offlineService.getCachedWeatherData).mockReturnValue(mockCachedData);

      const result = weatherService.getCachedWeatherData('test-location');
      
      expect(offlineService.getCachedWeatherData).toHaveBeenCalledWith('test-location');
      expect(result).toEqual(mockCachedData);
    });

    it('delegates hasCachedData to offline service', () => {
      vi.mocked(offlineService.hasCachedData).mockReturnValue(true);

      const result = weatherService.hasCachedData('test-location');
      
      expect(offlineService.hasCachedData).toHaveBeenCalledWith('test-location');
      expect(result).toBe(true);
    });

    it('delegates getCacheAge to offline service', () => {
      vi.mocked(offlineService.getCacheAge).mockReturnValue(15);

      const result = weatherService.getCacheAge('test-location');
      
      expect(offlineService.getCacheAge).toHaveBeenCalledWith('test-location');
      expect(result).toBe(15);
    });

    it('delegates clearCache to offline service', () => {
      weatherService.clearCache();
      
      expect(offlineService.clearCache).toHaveBeenCalled();
    });

    it('delegates getCacheStats to offline service', () => {
      const mockStats = {
        totalItems: 5,
        validItems: 3,
        expiredItems: 2,
        cacheSize: 1024,
        queueSize: 1
      };
      
      vi.mocked(offlineService.getCacheStats).mockReturnValue(mockStats);

      const result = weatherService.getCacheStats();
      
      expect(offlineService.getCacheStats).toHaveBeenCalled();
      expect(result).toEqual(mockStats);
    });
  });

  describe('error handling', () => {
    it('creates offline-specific errors', async () => {
      navigator.onLine = false;
      vi.mocked(offlineService.getCachedWeatherData).mockReturnValue(null);

      try {
        await weatherService.getCurrentWeatherOffline(mockLocation);
      } catch (error) {
        expect(error).toMatchObject({
          type: 'network',
          message: 'No cached weather data available for this location',
          retryable: true
        });
      }
    });

    it('handles offline service errors gracefully', async () => {
      vi.mocked(offlineService.cacheWeatherData).mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      // Should not throw even if caching fails
      const result = await weatherService.getCurrentWeatherOffline(mockLocation);
      expect(result).toBeDefined();
    });
  });
});