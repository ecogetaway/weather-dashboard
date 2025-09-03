import { useState, useEffect, useCallback } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
}

/**
 * Hook for monitoring network status and connection quality
 * Provides real-time updates on connectivity and performance
 */
export const useNetworkStatus = () => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(() => {
    // Initialize with current status
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    return {
      isOnline: navigator.onLine,
      isSlowConnection: connection ? connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g' : false,
      connectionType: connection?.type || 'unknown',
      effectiveType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink || 0,
      rtt: connection?.rtt || 0
    };
  });

  const updateNetworkStatus = useCallback(() => {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    setNetworkStatus({
      isOnline: navigator.onLine,
      isSlowConnection: connection ? connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g' : false,
      connectionType: connection?.type || 'unknown',
      effectiveType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink || 0,
      rtt: connection?.rtt || 0
    });
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      updateNetworkStatus();
    };

    const handleOffline = () => {
      updateNetworkStatus();
    };

    const handleConnectionChange = () => {
      updateNetworkStatus();
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for connection changes (if supported)
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, [updateNetworkStatus]);

  return networkStatus;
};

/**
 * Hook for detecting when the user comes back online
 * Useful for triggering data refresh when connectivity is restored
 */
export const useOnlineStatus = (onOnline?: () => void, onOffline?: () => void) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      onOnline?.();
    };

    const handleOffline = () => {
      setIsOnline(false);
      onOffline?.();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onOnline, onOffline]);

  return isOnline;
};

/**
 * Hook for detecting slow connections and adjusting behavior accordingly
 */
export const useConnectionQuality = () => {
  const networkStatus = useNetworkStatus();
  
  const isSlowConnection = networkStatus.isSlowConnection || 
    (networkStatus.effectiveType === '2g' || networkStatus.effectiveType === 'slow-2g') ||
    (networkStatus.downlink > 0 && networkStatus.downlink < 0.5) ||
    (networkStatus.rtt > 0 && networkStatus.rtt > 2000);

  const isFastConnection = networkStatus.effectiveType === '4g' || 
    (networkStatus.downlink > 2 && networkStatus.rtt < 500);

  return {
    ...networkStatus,
    isSlowConnection,
    isFastConnection,
    shouldReduceQuality: isSlowConnection,
    shouldPreloadData: isFastConnection && networkStatus.isOnline
  };
};