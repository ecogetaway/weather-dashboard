import type { CurrentWeather, ForecastDay, Location } from '@/types';

interface CachedWeatherData {
  location: Location;
  currentWeather: CurrentWeather;
  forecast: ForecastDay[];
  timestamp: number;
  expiresAt: number;
}

interface OfflineQueueItem {
  id: string;
  type: 'weather' | 'forecast' | 'search';
  location: Location;
  timestamp: number;
  retryCount: number;
}

/**
 * Service for managing offline functionality and data caching
 * Provides weather data caching and offline queue management
 */
export class OfflineService {
  private static readonly CACHE_KEY = 'weather_cache';
  private static readonly QUEUE_KEY = 'offline_queue';
  private static readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
  private static readonly MAX_CACHE_SIZE = 10; // Maximum cached locations
  private static readonly MAX_RETRY_COUNT = 3;

  /**
   * Cache weather data for offline access
   */
  cacheWeatherData(location: Location, currentWeather: CurrentWeather, forecast: ForecastDay[]): void {
    try {
      const cached = this.getCachedData();
      const timestamp = Date.now();
      const expiresAt = timestamp + OfflineService.CACHE_DURATION;

      const newCacheItem: CachedWeatherData = {
        location,
        currentWeather,
        forecast,
        timestamp,
        expiresAt
      };

      // Remove existing cache for this location
      const filteredCache = cached.filter(item => item.location.id !== location.id);
      
      // Add new cache item at the beginning
      const updatedCache = [newCacheItem, ...filteredCache];
      
      // Limit cache size
      const limitedCache = updatedCache.slice(0, OfflineService.MAX_CACHE_SIZE);

      localStorage.setItem(OfflineService.CACHE_KEY, JSON.stringify(limitedCache));
    } catch (error) {
      console.error('Failed to cache weather data:', error);
    }
  }

  /**
   * Get cached weather data for a location
   */
  getCachedWeatherData(locationId: string): CachedWeatherData | null {
    try {
      const cached = this.getCachedData();
      const item = cached.find(item => item.location.id === locationId);
      
      if (!item) {
        return null;
      }

      // Check if cache is still valid
      if (Date.now() > item.expiresAt) {
        this.removeCachedData(locationId);
        return null;
      }

      return item;
    } catch (error) {
      console.error('Failed to get cached weather data:', error);
      return null;
    }
  }

  /**
   * Get all cached weather data
   */
  getAllCachedData(): CachedWeatherData[] {
    return this.getCachedData().filter(item => Date.now() <= item.expiresAt);
  }

  /**
   * Remove cached data for a specific location
   */
  removeCachedData(locationId: string): void {
    try {
      const cached = this.getCachedData();
      const filtered = cached.filter(item => item.location.id !== locationId);
      localStorage.setItem(OfflineService.CACHE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to remove cached data:', error);
    }
  }

  /**
   * Clear all cached weather data
   */
  clearCache(): void {
    try {
      localStorage.removeItem(OfflineService.CACHE_KEY);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  /**
   * Add request to offline queue
   */
  addToOfflineQueue(type: 'weather' | 'forecast' | 'search', location: Location): void {
    try {
      const queue = this.getOfflineQueue();
      const id = `${type}-${location.id}-${Date.now()}`;
      
      const queueItem: OfflineQueueItem = {
        id,
        type,
        location,
        timestamp: Date.now(),
        retryCount: 0
      };

      // Remove existing queue item for same location and type
      const filteredQueue = queue.filter(item => 
        !(item.type === type && item.location.id === location.id)
      );

      const updatedQueue = [...filteredQueue, queueItem];
      localStorage.setItem(OfflineService.QUEUE_KEY, JSON.stringify(updatedQueue));
    } catch (error) {
      console.error('Failed to add to offline queue:', error);
    }
  }

  /**
   * Get all items in offline queue
   */
  getOfflineQueue(): OfflineQueueItem[] {
    try {
      const stored = localStorage.getItem(OfflineService.QUEUE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get offline queue:', error);
      return [];
    }
  }

  /**
   * Remove item from offline queue
   */
  removeFromOfflineQueue(itemId: string): void {
    try {
      const queue = this.getOfflineQueue();
      const filtered = queue.filter(item => item.id !== itemId);
      localStorage.setItem(OfflineService.QUEUE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to remove from offline queue:', error);
    }
  }

  /**
   * Increment retry count for queue item
   */
  incrementRetryCount(itemId: string): boolean {
    try {
      const queue = this.getOfflineQueue();
      const itemIndex = queue.findIndex(item => item.id === itemId);
      
      if (itemIndex === -1) {
        return false;
      }

      queue[itemIndex].retryCount++;

      // Remove item if max retries exceeded
      if (queue[itemIndex].retryCount >= OfflineService.MAX_RETRY_COUNT) {
        queue.splice(itemIndex, 1);
        localStorage.setItem(OfflineService.QUEUE_KEY, JSON.stringify(queue));
        return false;
      }

      localStorage.setItem(OfflineService.QUEUE_KEY, JSON.stringify(queue));
      return true;
    } catch (error) {
      console.error('Failed to increment retry count:', error);
      return false;
    }
  }

  /**
   * Clear offline queue
   */
  clearOfflineQueue(): void {
    try {
      localStorage.removeItem(OfflineService.QUEUE_KEY);
    } catch (error) {
      console.error('Failed to clear offline queue:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    totalItems: number;
    validItems: number;
    expiredItems: number;
    cacheSize: number;
    queueSize: number;
  } {
    const cached = this.getCachedData();
    const queue = this.getOfflineQueue();
    const now = Date.now();
    
    const validItems = cached.filter(item => now <= item.expiresAt);
    const expiredItems = cached.filter(item => now > item.expiresAt);

    return {
      totalItems: cached.length,
      validItems: validItems.length,
      expiredItems: expiredItems.length,
      cacheSize: this.calculateCacheSize(),
      queueSize: queue.length
    };
  }

  /**
   * Clean up expired cache entries
   */
  cleanupExpiredCache(): void {
    try {
      const cached = this.getCachedData();
      const now = Date.now();
      const validCache = cached.filter(item => now <= item.expiresAt);
      localStorage.setItem(OfflineService.CACHE_KEY, JSON.stringify(validCache));
    } catch (error) {
      console.error('Failed to cleanup expired cache:', error);
    }
  }

  /**
   * Check if location has cached data
   */
  hasCachedData(locationId: string): boolean {
    const cached = this.getCachedWeatherData(locationId);
    return cached !== null;
  }

  /**
   * Get cache age for a location (in minutes)
   */
  getCacheAge(locationId: string): number | null {
    const cached = this.getCachedWeatherData(locationId);
    if (!cached) {
      return null;
    }
    return Math.floor((Date.now() - cached.timestamp) / (1000 * 60));
  }

  private getCachedData(): CachedWeatherData[] {
    try {
      const stored = localStorage.getItem(OfflineService.CACHE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to parse cached data:', error);
      return [];
    }
  }

  private calculateCacheSize(): number {
    try {
      const stored = localStorage.getItem(OfflineService.CACHE_KEY);
      return stored ? new Blob([stored]).size : 0;
    } catch (error) {
      console.error('Failed to calculate cache size:', error);
      return 0;
    }
  }
}

// Create singleton instance
export const offlineService = new OfflineService();
export default OfflineService;