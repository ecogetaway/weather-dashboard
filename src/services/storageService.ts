import type { Location } from '@/types';

/**
 * Configuration for the storage service
 */
interface StorageConfig {
  maxRecentSearches: number;
  storageKey: string;
}

/**
 * Storage service for managing recent searches and user preferences
 */
export class StorageService {
  private config: StorageConfig;

  constructor(config?: Partial<StorageConfig>) {
    this.config = {
      maxRecentSearches: 5,
      storageKey: 'weather-dashboard',
      ...config
    };
  }

  /**
   * Get recent search locations
   */
  getRecentSearches(): Location[] {
    try {
      const stored = localStorage.getItem(`${this.config.storageKey}-recent-searches`);
      if (!stored) return [];

      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn('Failed to load recent searches:', error);
      return [];
    }
  }

  /**
   * Add a location to recent searches (FIFO queue with max limit)
   */
  addRecentSearch(location: Location): void {
    try {
      let recentSearches = this.getRecentSearches();

      // Remove existing entry if it exists (to move it to front)
      recentSearches = recentSearches.filter(item => item.id !== location.id);

      // Add to front
      recentSearches.unshift(location);

      // Limit to max items (FIFO - remove oldest)
      if (recentSearches.length > this.config.maxRecentSearches) {
        recentSearches = recentSearches.slice(0, this.config.maxRecentSearches);
      }

      localStorage.setItem(
        `${this.config.storageKey}-recent-searches`,
        JSON.stringify(recentSearches)
      );
    } catch (error) {
      console.warn('Failed to save recent search:', error);
    }
  }

  /**
   * Remove a location from recent searches
   */
  removeRecentSearch(locationId: string): void {
    try {
      const recentSearches = this.getRecentSearches();
      const filtered = recentSearches.filter(item => item.id !== locationId);
      
      localStorage.setItem(
        `${this.config.storageKey}-recent-searches`,
        JSON.stringify(filtered)
      );
    } catch (error) {
      console.warn('Failed to remove recent search:', error);
    }
  }

  /**
   * Clear all recent searches
   */
  clearRecentSearches(): void {
    try {
      localStorage.removeItem(`${this.config.storageKey}-recent-searches`);
    } catch (error) {
      console.warn('Failed to clear recent searches:', error);
    }
  }

  /**
   * Get user temperature preference
   */
  getTemperatureUnit(): 'celsius' | 'fahrenheit' {
    try {
      const stored = localStorage.getItem(`${this.config.storageKey}-temperature-unit`);
      return stored === 'fahrenheit' ? 'fahrenheit' : 'celsius';
    } catch (error) {
      console.warn('Failed to load temperature preference:', error);
      return 'celsius';
    }
  }

  /**
   * Set user temperature preference
   */
  setTemperatureUnit(unit: 'celsius' | 'fahrenheit'): void {
    try {
      localStorage.setItem(`${this.config.storageKey}-temperature-unit`, unit);
    } catch (error) {
      console.warn('Failed to save temperature preference:', error);
    }
  }

  /**
   * Get last searched location
   */
  getLastSearchedLocation(): Location | null {
    try {
      const stored = localStorage.getItem(`${this.config.storageKey}-last-location`);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('Failed to load last searched location:', error);
      return null;
    }
  }

  /**
   * Set last searched location
   */
  setLastSearchedLocation(location: Location): void {
    try {
      localStorage.setItem(
        `${this.config.storageKey}-last-location`,
        JSON.stringify(location)
      );
    } catch (error) {
      console.warn('Failed to save last searched location:', error);
    }
  }

  /**
   * Check if localStorage is available
   */
  isStorageAvailable(): boolean {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get storage usage information
   */
  getStorageInfo(): { available: boolean; used: number; total: number } {
    if (!this.isStorageAvailable()) {
      return { available: false, used: 0, total: 0 };
    }

    try {
      // Estimate storage usage
      let used = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key) && key.startsWith(this.config.storageKey)) {
          used += localStorage[key].length + key.length;
        }
      }

      // Most browsers have ~5-10MB localStorage limit
      const estimatedTotal = 5 * 1024 * 1024; // 5MB

      return {
        available: true,
        used,
        total: estimatedTotal
      };
    } catch (error) {
      console.warn('Failed to get storage info:', error);
      return { available: true, used: 0, total: 0 };
    }
  }

  /**
   * Clear all app data from localStorage
   */
  clearAllData(): void {
    try {
      const keysToRemove: string[] = [];
      
      // Use Object.keys instead of for...in to avoid prototype issues
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(this.config.storageKey)) {
          keysToRemove.push(key);
        }
      });

      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear all data:', error);
    }
  }

  /**
   * Export user data for backup
   */
  exportData(): string {
    try {
      const data = {
        recentSearches: this.getRecentSearches(),
        temperatureUnit: this.getTemperatureUnit(),
        lastSearchedLocation: this.getLastSearchedLocation(),
        exportDate: new Date().toISOString()
      };

      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.warn('Failed to export data:', error);
      return '{}';
    }
  }

  /**
   * Import user data from backup
   */
  importData(dataString: string): boolean {
    try {
      const data = JSON.parse(dataString);

      if (data.recentSearches && Array.isArray(data.recentSearches)) {
        localStorage.setItem(
          `${this.config.storageKey}-recent-searches`,
          JSON.stringify(data.recentSearches)
        );
      }

      if (data.temperatureUnit) {
        this.setTemperatureUnit(data.temperatureUnit);
      }

      if (data.lastSearchedLocation) {
        this.setLastSearchedLocation(data.lastSearchedLocation);
      }

      return true;
    } catch (error) {
      console.warn('Failed to import data:', error);
      return false;
    }
  }
}

// Export a default instance
export const storageService = new StorageService();