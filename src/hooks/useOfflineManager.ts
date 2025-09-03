import { useState, useEffect, useCallback } from 'react';
import { useNetworkStatus, useOnlineStatus } from './useNetworkStatus';
import { weatherService } from '@/services/weatherService';
import { offlineService } from '@/services/offlineService';
import { useToastHelpers } from '@/contexts/ToastContext';

export interface OfflineManagerState {
  isOffline: boolean;
  hasOfflineData: boolean;
  queueSize: number;
  cacheStats: {
    totalItems: number;
    validItems: number;
    expiredItems: number;
    cacheSize: number;
    queueSize: number;
  };
  isProcessingQueue: boolean;
}

/**
 * Hook for managing offline functionality and data synchronization
 * Handles offline queue processing, cache management, and user notifications
 */
export const useOfflineManager = () => {
  const networkStatus = useNetworkStatus();
  const { isOnline, wasOffline } = useOnlineStatus();
  const { showSuccess, showError, showInfo } = useToastHelpers();

  const [state, setState] = useState<OfflineManagerState>(() => ({
    isOffline: !navigator.onLine,
    hasOfflineData: false,
    queueSize: 0,
    cacheStats: offlineService.getCacheStats(),
    isProcessingQueue: false
  }));

  // Update state when network status changes
  useEffect(() => {
    const cacheStats = offlineService.getCacheStats();
    setState(prev => ({
      ...prev,
      isOffline: !isOnline,
      hasOfflineData: cacheStats.validItems > 0,
      queueSize: cacheStats.queueSize,
      cacheStats
    }));
  }, [isOnline, networkStatus]);

  // Process offline queue when coming back online
  useEffect(() => {
    if (isOnline && wasOffline && state.queueSize > 0) {
      processOfflineQueue();
    }
  }, [isOnline, wasOffline, state.queueSize]);

  /**
   * Process all items in the offline queue
   */
  const processOfflineQueue = useCallback(async () => {
    if (state.isProcessingQueue || !isOnline) {
      return;
    }

    setState(prev => ({ ...prev, isProcessingQueue: true }));

    try {
      const result = await weatherService.processOfflineQueue();
      
      if (result.processed > 0) {
        showSuccess(
          'Data synchronized',
          `Successfully updated ${result.processed} weather location${result.processed > 1 ? 's' : ''}`
        );
      }

      if (result.failed > 0) {
        showError(
          'Some updates failed',
          `${result.failed} location${result.failed > 1 ? 's' : ''} could not be updated. They will be retried later.`
        );
      }

      // Update state with new cache stats
      const cacheStats = offlineService.getCacheStats();
      setState(prev => ({
        ...prev,
        queueSize: cacheStats.queueSize,
        cacheStats,
        isProcessingQueue: false
      }));
    } catch (error) {
      console.error('Failed to process offline queue:', error);
      showError(
        'Sync failed',
        'Could not synchronize offline data. Will retry automatically.'
      );
      setState(prev => ({ ...prev, isProcessingQueue: false }));
    }
  }, [state.isProcessingQueue, isOnline, showSuccess, showError]);

  /**
   * Clear all cached data
   */
  const clearCache = useCallback(() => {
    try {
      weatherService.clearCache();
      const cacheStats = offlineService.getCacheStats();
      setState(prev => ({
        ...prev,
        hasOfflineData: false,
        cacheStats
      }));
      showInfo('Cache cleared', 'All cached weather data has been removed');
    } catch (error) {
      console.error('Failed to clear cache:', error);
      showError('Clear cache failed', 'Could not clear cached data');
    }
  }, [showInfo, showError]);

  /**
   * Clean up expired cache entries
   */
  const cleanupCache = useCallback(() => {
    try {
      offlineService.cleanupExpiredCache();
      const cacheStats = offlineService.getCacheStats();
      setState(prev => ({
        ...prev,
        cacheStats
      }));
      if (cacheStats.expiredItems > 0) {
        showInfo(
          'Cache cleaned',
          `Removed ${cacheStats.expiredItems} expired cache entr${cacheStats.expiredItems > 1 ? 'ies' : 'y'}`
        );
      }
    } catch (error) {
      console.error('Failed to cleanup cache:', error);
    }
  }, [showInfo]);

  /**
   * Get cached data for a specific location
   */
  const getCachedData = useCallback((locationId: string) => {
    return weatherService.getCachedWeatherData(locationId);
  }, []);

  /**
   * Check if location has cached data
   */
  const hasCachedData = useCallback((locationId: string) => {
    return weatherService.hasCachedData(locationId);
  }, []);

  /**
   * Get cache age for a location
   */
  const getCacheAge = useCallback((locationId: string) => {
    return weatherService.getCacheAge(locationId);
  }, []);

  /**
   * Force refresh cache stats
   */
  const refreshCacheStats = useCallback(() => {
    const cacheStats = offlineService.getCacheStats();
    setState(prev => ({
      ...prev,
      hasOfflineData: cacheStats.validItems > 0,
      queueSize: cacheStats.queueSize,
      cacheStats
    }));
  }, []);

  /**
   * Get offline queue items
   */
  const getOfflineQueue = useCallback(() => {
    return offlineService.getOfflineQueue();
  }, []);

  /**
   * Manually retry a specific queue item
   */
  const retryQueueItem = useCallback(async (itemId: string) => {
    const queue = offlineService.getOfflineQueue();
    const item = queue.find(q => q.id === itemId);
    
    if (!item || !isOnline) {
      return false;
    }

    try {
      if (item.type === 'weather') {
        await weatherService.getCurrentWeatherOffline(item.location);
      } else if (item.type === 'forecast') {
        await weatherService.getForecastOffline(item.location);
      }
      
      offlineService.removeFromOfflineQueue(itemId);
      refreshCacheStats();
      showSuccess(
        'Data updated',
        `Successfully updated weather for ${item.location.name}`
      );
      return true;
    } catch (error) {
      console.error('Failed to retry queue item:', error);
      showError(
        'Retry failed',
        `Could not update weather for ${item.location.name}`
      );
      return false;
    }
  }, [isOnline, refreshCacheStats, showSuccess, showError]);

  return {
    ...state,
    networkStatus,
    processOfflineQueue,
    clearCache,
    cleanupCache,
    getCachedData,
    hasCachedData,
    getCacheAge,
    refreshCacheStats,
    getOfflineQueue,
    retryQueueItem
  };
};

export default useOfflineManager;