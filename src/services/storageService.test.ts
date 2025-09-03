import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StorageService } from './storageService';
import type { Location } from '@/types';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

describe('StorageService', () => {
  let storageService: StorageService;
  const mockLocation: Location = {
    id: '123',
    name: 'London',
    country: 'GB',
    lat: 51.5074,
    lon: -0.1278
  };

  const mockLocation2: Location = {
    id: '456',
    name: 'Paris',
    country: 'FR',
    lat: 48.8566,
    lon: 2.3522
  };

  beforeEach(() => {
    storageService = new StorageService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('recent searches', () => {
    it('should return empty array when no recent searches exist', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const result = storageService.getRecentSearches();
      expect(result).toEqual([]);
    });

    it('should return parsed recent searches', () => {
      const mockData = [mockLocation, mockLocation2];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockData));
      
      const result = storageService.getRecentSearches();
      expect(result).toEqual(mockData);
    });

    it('should handle invalid JSON gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');
      
      const result = storageService.getRecentSearches();
      expect(result).toEqual([]);
    });

    it('should add new location to recent searches', () => {
      mockLocalStorage.getItem.mockReturnValue('[]');
      
      storageService.addRecentSearch(mockLocation);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'weather-dashboard-recent-searches',
        JSON.stringify([mockLocation])
      );
    });

    it('should move existing location to front when added again', () => {
      const existingData = [mockLocation2, mockLocation];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingData));
      
      storageService.addRecentSearch(mockLocation);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'weather-dashboard-recent-searches',
        JSON.stringify([mockLocation, mockLocation2])
      );
    });

    it('should limit recent searches to maximum count', () => {
      const storageServiceWithLimit = new StorageService({ maxRecentSearches: 2 });
      const existingData = [mockLocation, mockLocation2];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingData));
      
      const newLocation: Location = {
        id: '789',
        name: 'Berlin',
        country: 'DE',
        lat: 52.5200,
        lon: 13.4050
      };
      
      storageServiceWithLimit.addRecentSearch(newLocation);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'weather-dashboard-recent-searches',
        JSON.stringify([newLocation, mockLocation])
      );
    });

    it('should remove location from recent searches', () => {
      const existingData = [mockLocation, mockLocation2];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingData));
      
      storageService.removeRecentSearch(mockLocation.id);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'weather-dashboard-recent-searches',
        JSON.stringify([mockLocation2])
      );
    });

    it('should clear all recent searches', () => {
      storageService.clearRecentSearches();
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        'weather-dashboard-recent-searches'
      );
    });

    it('should handle storage errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      const result = storageService.getRecentSearches();
      expect(result).toEqual([]);
    });
  });

  describe('temperature unit preference', () => {
    it('should return celsius as default', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const result = storageService.getTemperatureUnit();
      expect(result).toBe('celsius');
    });

    it('should return stored temperature unit', () => {
      mockLocalStorage.getItem.mockReturnValue('fahrenheit');
      
      const result = storageService.getTemperatureUnit();
      expect(result).toBe('fahrenheit');
    });

    it('should save temperature unit preference', () => {
      storageService.setTemperatureUnit('fahrenheit');
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'weather-dashboard-temperature-unit',
        'fahrenheit'
      );
    });

    it('should handle invalid temperature unit gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid');
      
      const result = storageService.getTemperatureUnit();
      expect(result).toBe('celsius');
    });
  });

  describe('last searched location', () => {
    it('should return null when no last location exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const result = storageService.getLastSearchedLocation();
      expect(result).toBeNull();
    });

    it('should return parsed last location', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockLocation));
      
      const result = storageService.getLastSearchedLocation();
      expect(result).toEqual(mockLocation);
    });

    it('should save last searched location', () => {
      storageService.setLastSearchedLocation(mockLocation);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'weather-dashboard-last-location',
        JSON.stringify(mockLocation)
      );
    });

    it('should handle invalid JSON for last location', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');
      
      const result = storageService.getLastSearchedLocation();
      expect(result).toBeNull();
    });
  });

  describe('storage availability', () => {
    it('should detect available storage', () => {
      const result = storageService.isStorageAvailable();
      expect(result).toBe(true);
    });

    it('should detect unavailable storage', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage not available');
      });
      
      const result = storageService.isStorageAvailable();
      expect(result).toBe(false);
    });
  });

  describe('storage info', () => {
    it('should return storage info when available', () => {
      // Mock localStorage with some data
      Object.defineProperty(mockLocalStorage, 'hasOwnProperty', {
        value: vi.fn().mockReturnValue(true)
      });
      
      const mockKeys = ['weather-dashboard-recent-searches', 'weather-dashboard-temperature-unit'];
      mockKeys.forEach(key => {
        mockLocalStorage[key] = 'some data';
      });
      
      const result = storageService.getStorageInfo();
      
      expect(result.available).toBe(true);
      expect(result.used).toBeGreaterThanOrEqual(0);
      expect(result.total).toBeGreaterThan(0);
    });

    it('should return unavailable when storage is not accessible', () => {
      const unavailableService = new StorageService();
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage not available');
      });
      
      const result = unavailableService.getStorageInfo();
      expect(result.available).toBe(false);
    });
  });

  describe('data management', () => {
    it('should clear all app data', () => {
      // Mock localStorage with some keys
      const mockKeys = [
        'weather-dashboard-recent-searches',
        'weather-dashboard-temperature-unit',
        'other-app-data'
      ];
      
      // Mock Object.keys to return our test keys
      vi.spyOn(Object, 'keys').mockReturnValue(mockKeys);
      
      storageService.clearAllData();
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('weather-dashboard-recent-searches');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('weather-dashboard-temperature-unit');
      expect(mockLocalStorage.removeItem).not.toHaveBeenCalledWith('other-app-data');
    });

    it('should export data correctly', () => {
      mockLocalStorage.getItem
        .mockReturnValueOnce(JSON.stringify([mockLocation]))  // recent searches
        .mockReturnValueOnce('fahrenheit')                     // temperature unit
        .mockReturnValueOnce(JSON.stringify(mockLocation2));   // last location
      
      const exported = storageService.exportData();
      const parsed = JSON.parse(exported);
      
      expect(parsed.recentSearches).toEqual([mockLocation]);
      expect(parsed.temperatureUnit).toBe('fahrenheit');
      expect(parsed.lastSearchedLocation).toEqual(mockLocation2);
      expect(parsed.exportDate).toBeDefined();
    });

    it('should import data correctly', () => {
      const importData = {
        recentSearches: [mockLocation],
        temperatureUnit: 'fahrenheit',
        lastSearchedLocation: mockLocation2,
        exportDate: new Date().toISOString()
      };
      
      const result = storageService.importData(JSON.stringify(importData));
      
      expect(result).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'weather-dashboard-recent-searches',
        JSON.stringify([mockLocation])
      );
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'weather-dashboard-temperature-unit',
        'fahrenheit'
      );
    });

    it('should handle invalid import data', () => {
      const result = storageService.importData('invalid json');
      expect(result).toBe(false);
    });
  });
});