import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OfflineService } from './offlineService';
import type { CurrentWeather, ForecastDay, Location } from '@/types';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('OfflineService', () => {
  let offlineService: OfflineService;
  
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
    offlineService = new OfflineService();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('cacheWeatherData', () => {
    it('caches weather data successfully', () => {
      offlineService.cacheWeatherData(mockLocation, mockCurrentWeather, mockForecast);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'weather_cache',
        expect.stringContaining('test-location')
      );
    });

    it('limits cache size to maximum', () => {
      // Mock existing cache with max items
      const existingCache = Array.from({ length: 10 }, (_, i) => ({
        location: { ...mockLocation, id: `location-${i}` },
        currentWeather: mockCurrentWeather,
        forecast: mockForecast,
        timestamp: Date.now(),
        expiresAt: Date.now() + 30 * 60 * 1000,
      }));
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingCache));

      offlineService.cacheWeatherData(mockLocation, mockCurrentWeather, mockForecast);

      const setItemCall = mockLocalStorage.setItem.mock.calls[0];
      const cachedData = JSON.parse(setItemCall[1]);
      expect(cachedData).toHaveLength(10); // Should not exceed max size
      expect(cachedData[0].location.id).toBe('test-location'); // New item should be first
    });

    it('handles localStorage errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      expect(() => {
        offlineService.cacheWeatherData(mockLocation, mockCurrentWeather, mockForecast);
      }).not.toThrow();
    });
  });

  describe('getCachedWeatherData', () => {
    it('returns cached data when valid', () => {
      const timestamp = Date.now();
      const cachedData = [{
        location: mockLocation,
        currentWeather: mockCurrentWeather,
        forecast: mockForecast,
        timestamp,
        expiresAt: timestamp + 30 * 60 * 1000,
      }];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(cachedData));

      const result = offlineService.getCachedWeatherData('test-location');
      expect(result).toEqual(cachedData[0]);
    });

    it('returns null for expired data', () => {
      const timestamp = Date.now() - 60 * 60 * 1000; // 1 hour ago
      const cachedData = [{
        location: mockLocation,
        currentWeather: mockCurrentWeather,
        forecast: mockForecast,
        timestamp,
        expiresAt: timestamp + 30 * 60 * 1000, // Expired 30 minutes ago
      }];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(cachedData));

      const result = offlineService.getCachedWeatherData('test-location');
      expect(result).toBeNull();
      expect(mockLocalStorage.setItem).toHaveBeenCalled(); // Should remove expired data
    });

    it('returns null for non-existent location', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([]));
      const result = offlineService.getCachedWeatherData('non-existent');
      expect(result).toBeNull();
    });

    it('handles localStorage errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      const result = offlineService.getCachedWeatherData('test-location');
      expect(result).toBeNull();
    });
  });

  describe('offline queue management', () => {
    it('adds items to offline queue', () => {
      offlineService.addToOfflineQueue('weather', mockLocation);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'offline_queue',
        expect.stringContaining('weather')
      );
    });

    it('removes duplicate queue items for same location and type', () => {
      const existingQueue = [{
        id: 'weather-test-location-123',
        type: 'weather',
        location: mockLocation,
        timestamp: Date.now(),
        retryCount: 0,
      }];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingQueue));

      offlineService.addToOfflineQueue('weather', mockLocation);
      
      const setItemCall = mockLocalStorage.setItem.mock.calls[0];
      const queueData = JSON.parse(setItemCall[1]);
      expect(queueData).toHaveLength(1); // Should replace, not add
    });

    it('increments retry count', () => {
      const queueItem = {
        id: 'test-item',
        type: 'weather',
        location: mockLocation,
        timestamp: Date.now(),
        retryCount: 0,
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([queueItem]));

      const result = offlineService.incrementRetryCount('test-item');
      expect(result).toBe(true);
      
      const setItemCall = mockLocalStorage.setItem.mock.calls[0];
      const queueData = JSON.parse(setItemCall[1]);
      expect(queueData[0].retryCount).toBe(1);
    });

    it('removes item when max retries exceeded', () => {
      const queueItem = {
        id: 'test-item',
        type: 'weather',
        location: mockLocation,
        timestamp: Date.now(),
        retryCount: 2, // One less than max
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([queueItem]));

      const result = offlineService.incrementRetryCount('test-item');
      expect(result).toBe(false);
      
      const setItemCall = mockLocalStorage.setItem.mock.calls[0];
      const queueData = JSON.parse(setItemCall[1]);
      expect(queueData).toHaveLength(0); // Should be removed
    });
  });

  describe('cache management', () => {
    it('cleans up expired cache entries', () => {
      const now = Date.now();
      const cachedData = [
        {
          location: { ...mockLocation, id: 'valid' },
          currentWeather: mockCurrentWeather,
          forecast: mockForecast,
          timestamp: now,
          expiresAt: now + 30 * 60 * 1000, // Valid
        },
        {
          location: { ...mockLocation, id: 'expired' },
          currentWeather: mockCurrentWeather,
          forecast: mockForecast,
          timestamp: now - 60 * 60 * 1000,
          expiresAt: now - 30 * 60 * 1000, // Expired
        },
      ];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(cachedData));

      offlineService.cleanupExpiredCache();
      
      const setItemCall = mockLocalStorage.setItem.mock.calls[0];
      const cleanedData = JSON.parse(setItemCall[1]);
      expect(cleanedData).toHaveLength(1);
      expect(cleanedData[0].location.id).toBe('valid');
    });

    it('provides cache statistics', () => {
      const now = Date.now();
      const cachedData = [
        {
          location: { ...mockLocation, id: 'valid' },
          currentWeather: mockCurrentWeather,
          forecast: mockForecast,
          timestamp: now,
          expiresAt: now + 30 * 60 * 1000,
        },
        {
          location: { ...mockLocation, id: 'expired' },
          currentWeather: mockCurrentWeather,
          forecast: mockForecast,
          timestamp: now - 60 * 60 * 1000,
          expiresAt: now - 30 * 60 * 1000,
        },
      ];
      const queueData = [{ id: 'test', type: 'weather', location: mockLocation, timestamp: now, retryCount: 0 }];
      
      mockLocalStorage.getItem
        .mockReturnValueOnce(JSON.stringify(cachedData)) // For cache
        .mockReturnValueOnce(JSON.stringify(queueData)); // For queue

      const stats = offlineService.getCacheStats();
      expect(stats.totalItems).toBe(2);
      expect(stats.validItems).toBe(1);
      expect(stats.expiredItems).toBe(1);
      expect(stats.queueSize).toBe(1);
    });

    it('checks if location has cached data', () => {
      const cachedData = [{
        location: mockLocation,
        currentWeather: mockCurrentWeather,
        forecast: mockForecast,
        timestamp: Date.now(),
        expiresAt: Date.now() + 30 * 60 * 1000,
      }];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(cachedData));

      expect(offlineService.hasCachedData('test-location')).toBe(true);
      expect(offlineService.hasCachedData('non-existent')).toBe(false);
    });

    it('calculates cache age correctly', () => {
      const timestamp = Date.now() - 10 * 60 * 1000; // 10 minutes ago
      const cachedData = [{
        location: mockLocation,
        currentWeather: mockCurrentWeather,
        forecast: mockForecast,
        timestamp,
        expiresAt: timestamp + 30 * 60 * 1000,
      }];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(cachedData));

      const age = offlineService.getCacheAge('test-location');
      expect(age).toBeGreaterThanOrEqual(9);
      expect(age).toBeLessThanOrEqual(11);
    });
  });
});