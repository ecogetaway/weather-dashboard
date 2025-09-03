import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useOfflineManager } from './useOfflineManager';
import { weatherService } from '@/services/weatherService';
import { offlineService } from '@/services/offlineService';

// Mock dependencies
vi.mock('./useNetworkStatus', () => ({
  useNetworkStatus: vi.fn(() => ({
    isOnline: true,
    isSlowConnection: false,
    connectionType: 'wifi',
    effectiveType: '4g',
    downlink: 2.5,
    rtt: 50
  })),
  useOnlineStatus: vi.fn(() => ({
    isOnline: true,
    wasOffline: false
  }))
}));

vi.mock('@/contexts/ToastContext', () => ({
  useToastHelpers: vi.fn(() => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
    showInfo: vi.fn(),
    showWarning: vi.fn()
  }))
}));

vi.mock('@/services/weatherService', () => ({
  weatherService: {
    processOfflineQueue: vi.fn(),
    clearCache: vi.fn(),
    getCachedWeatherData: vi.fn(),
    hasCachedData: vi.fn(),
    getCacheAge: vi.fn(),
    getCurrentWeatherOffline: vi.fn(),
    getForecastOffline: vi.fn()
  }
}));

vi.mock('@/services/offlineService', () => ({
  offlineService: {
    getCacheStats: vi.fn(),
    cleanupExpiredCache: vi.fn(),
    getOfflineQueue: vi.fn(),
    removeFromOfflineQueue: vi.fn()
  }
}));

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

describe('useOfflineManager', () => {
  const mockToastHelpers = {
    showSuccess: vi.fn(),
    showError: vi.fn(),
    showInfo: vi.fn(),
    showWarning: vi.fn()
  };

  const mockCacheStats = {
    totalItems: 5,
    validItems: 3,
    expiredItems: 2,
    cacheSize: 1024,
    queueSize: 1
  };

  beforeEach(() => {
    vi.clearAllMocks();
    navigator.onLine = true;
    
    // Setup default mocks
    vi.mocked(offlineService.getCacheStats).mockReturnValue(mockCacheStats);
    vi.mocked(weatherService.processOfflineQueue).mockResolvedValue({
      processed: 1,
      failed: 0,
      results: [{ id: 'test', success: true }]
    });
    
    // Mock useToastHelpers
    const { useToastHelpers } = await import('@/contexts/ToastContext');
    vi.mocked(useToastHelpers).mockReturnValue(mockToastHelpers);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useOfflineManager());

    expect(result.current.isOffline).toBe(false);
    expect(result.current.hasOfflineData).toBe(true); // validItems > 0
    expect(result.current.queueSize).toBe(1);
    expect(result.current.cacheStats).toEqual(mockCacheStats);
    expect(result.current.isProcessingQueue).toBe(false);
  });

  it('updates state when network status changes', async () => {
    const { useNetworkStatus } = await import('./useNetworkStatus');
    const mockUseNetworkStatus = vi.mocked(useNetworkStatus);
    
    const { result, rerender } = renderHook(() => useOfflineManager());

    // Simulate going offline
    mockUseNetworkStatus.mockReturnValue({
      isOnline: false,
      isSlowConnection: false,
      connectionType: 'none',
      effectiveType: 'none',
      downlink: 0,
      rtt: 0
    });

    navigator.onLine = false;
    rerender();

    expect(result.current.isOffline).toBe(true);
  });

  it('processes offline queue successfully', async () => {
    const { result } = renderHook(() => useOfflineManager());

    await act(async () => {
      await result.current.processOfflineQueue();
    });

    expect(weatherService.processOfflineQueue).toHaveBeenCalled();
    expect(mockToastHelpers.showSuccess).toHaveBeenCalledWith(
      'Data synchronized',
      'Successfully updated 1 weather location'
    );
  });

  it('handles offline queue processing errors', async () => {
    vi.mocked(weatherService.processOfflineQueue).mockRejectedValue(
      new Error('Network error')
    );

    const { result } = renderHook(() => useOfflineManager());

    await act(async () => {
      await result.current.processOfflineQueue();
    });

    expect(mockToastHelpers.showError).toHaveBeenCalledWith(
      'Sync failed',
      'Could not synchronize offline data. Will retry automatically.'
    );
  });

  it('shows appropriate messages for failed queue items', async () => {
    vi.mocked(weatherService.processOfflineQueue).mockResolvedValue({
      processed: 1,
      failed: 2,
      results: [
        { id: 'test1', success: true },
        { id: 'test2', success: false, error: 'Network error' },
        { id: 'test3', success: false, error: 'API error' }
      ]
    });

    const { result } = renderHook(() => useOfflineManager());

    await act(async () => {
      await result.current.processOfflineQueue();
    });

    expect(mockToastHelpers.showSuccess).toHaveBeenCalledWith(
      'Data synchronized',
      'Successfully updated 1 weather location'
    );
    expect(mockToastHelpers.showError).toHaveBeenCalledWith(
      'Some updates failed',
      '2 locations could not be updated. They will be retried later.'
    );
  });

  it('clears cache successfully', async () => {
    const { result } = renderHook(() => useOfflineManager());

    await act(async () => {
      result.current.clearCache();
    });

    expect(weatherService.clearCache).toHaveBeenCalled();
    expect(mockToastHelpers.showInfo).toHaveBeenCalledWith(
      'Cache cleared',
      'All cached weather data has been removed'
    );
  });

  it('handles cache clearing errors', async () => {
    vi.mocked(weatherService.clearCache).mockImplementation(() => {
      throw new Error('Storage error');
    });

    const { result } = renderHook(() => useOfflineManager());

    await act(async () => {
      result.current.clearCache();
    });

    expect(mockToastHelpers.showError).toHaveBeenCalledWith(
      'Clear cache failed',
      'Could not clear cached data'
    );
  });

  it('cleans up expired cache entries', async () => {
    const updatedStats = { ...mockCacheStats, expiredItems: 3 };
    vi.mocked(offlineService.getCacheStats)
      .mockReturnValueOnce(mockCacheStats)
      .mockReturnValueOnce(updatedStats);

    const { result } = renderHook(() => useOfflineManager());

    await act(async () => {
      result.current.cleanupCache();
    });

    expect(offlineService.cleanupExpiredCache).toHaveBeenCalled();
    expect(mockToastHelpers.showInfo).toHaveBeenCalledWith(
      'Cache cleaned',
      'Removed 3 expired cache entries'
    );
  });

  it('provides cached data access methods', () => {
    const mockCachedData = { location: { id: 'test' }, currentWeather: {}, forecast: [] };
    vi.mocked(weatherService.getCachedWeatherData).mockReturnValue(mockCachedData);
    vi.mocked(weatherService.hasCachedData).mockReturnValue(true);
    vi.mocked(weatherService.getCacheAge).mockReturnValue(15);

    const { result } = renderHook(() => useOfflineManager());

    expect(result.current.getCachedData('test')).toEqual(mockCachedData);
    expect(result.current.hasCachedData('test')).toBe(true);
    expect(result.current.getCacheAge('test')).toBe(15);
  });

  it('refreshes cache stats', async () => {
    const newStats = { ...mockCacheStats, validItems: 5 };
    vi.mocked(offlineService.getCacheStats)
      .mockReturnValueOnce(mockCacheStats)
      .mockReturnValueOnce(newStats);

    const { result } = renderHook(() => useOfflineManager());

    act(() => {
      result.current.refreshCacheStats();
    });

    expect(result.current.cacheStats.validItems).toBe(5);
  });

  it('retries individual queue items successfully', async () => {
    const mockLocation = { id: 'test-location', name: 'Test City', lat: 0, lon: 0, country: 'TC' };
    const mockQueueItem = {
      id: 'test-item',
      type: 'weather' as const,
      location: mockLocation,
      timestamp: Date.now(),
      retryCount: 0
    };

    vi.mocked(offlineService.getOfflineQueue).mockReturnValue([mockQueueItem]);
    vi.mocked(weatherService.getCurrentWeatherOffline).mockResolvedValue({} as any);

    const { result } = renderHook(() => useOfflineManager());

    let retryResult;
    await act(async () => {
      retryResult = await result.current.retryQueueItem('test-item');
    });

    expect(retryResult).toBe(true);
    expect(weatherService.getCurrentWeatherOffline).toHaveBeenCalledWith(mockLocation);
    expect(offlineService.removeFromOfflineQueue).toHaveBeenCalledWith('test-item');
    expect(mockToastHelpers.showSuccess).toHaveBeenCalledWith(
      'Data updated',
      'Successfully updated weather for Test City'
    );
  });

  it('handles queue item retry failures', async () => {
    const mockLocation = { id: 'test-location', name: 'Test City', lat: 0, lon: 0, country: 'TC' };
    const mockQueueItem = {
      id: 'test-item',
      type: 'weather' as const,
      location: mockLocation,
      timestamp: Date.now(),
      retryCount: 0
    };

    vi.mocked(offlineService.getOfflineQueue).mockReturnValue([mockQueueItem]);
    vi.mocked(weatherService.getCurrentWeatherOffline).mockRejectedValue(
      new Error('Network error')
    );

    const { result } = renderHook(() => useOfflineManager());

    let retryResult;
    await act(async () => {
      retryResult = await result.current.retryQueueItem('test-item');
    });

    expect(retryResult).toBe(false);
    expect(mockToastHelpers.showError).toHaveBeenCalledWith(
      'Retry failed',
      'Could not update weather for Test City'
    );
  });

  it('handles forecast queue items', async () => {
    const mockLocation = { id: 'test-location', name: 'Test City', lat: 0, lon: 0, country: 'TC' };
    const mockQueueItem = {
      id: 'test-item',
      type: 'forecast' as const,
      location: mockLocation,
      timestamp: Date.now(),
      retryCount: 0
    };

    vi.mocked(offlineService.getOfflineQueue).mockReturnValue([mockQueueItem]);
    vi.mocked(weatherService.getForecastOffline).mockResolvedValue([]);

    const { result } = renderHook(() => useOfflineManager());

    await act(async () => {
      await result.current.retryQueueItem('test-item');
    });

    expect(weatherService.getForecastOffline).toHaveBeenCalledWith(mockLocation);
  });

  it('returns false for non-existent queue items', async () => {
    vi.mocked(offlineService.getOfflineQueue).mockReturnValue([]);

    const { result } = renderHook(() => useOfflineManager());

    let retryResult;
    await act(async () => {
      retryResult = await result.current.retryQueueItem('non-existent');
    });

    expect(retryResult).toBe(false);
  });

  it('returns false when offline for queue retry', async () => {
    const { useOnlineStatus } = await import('./useNetworkStatus');
    vi.mocked(useOnlineStatus).mockReturnValue({
      isOnline: false,
      wasOffline: true
    });

    const { result } = renderHook(() => useOfflineManager());

    let retryResult;
    await act(async () => {
      retryResult = await result.current.retryQueueItem('test-item');
    });

    expect(retryResult).toBe(false);
  });
});