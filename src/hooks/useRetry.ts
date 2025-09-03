import { useState, useCallback, useRef } from 'react';

export interface UseRetryOptions {
  maxRetries?: number;
  delay?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number) => void;
  onMaxRetriesReached?: () => void;
}

export interface UseRetryReturn {
  retry: <T>(fn: () => Promise<T> | T) => Promise<T>;
  retryCount: number;
  isRetrying: boolean;
  reset: () => void;
  canRetry: boolean;
}

/**
 * Hook for managing retry logic with exponential backoff
 * Provides configurable retry attempts and delay management
 */
export const useRetry = (options: UseRetryOptions = {}): UseRetryReturn => {
  const {
    maxRetries = 3,
    delay = 1000,
    backoffMultiplier = 2,
    onRetry,
    onMaxRetriesReached,
  } = options;

  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const reset = useCallback(() => {
    setRetryCount(0);
    setIsRetrying(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const sleep = useCallback((ms: number): Promise<void> => {
    return new Promise(resolve => {
      timeoutRef.current = setTimeout(resolve, ms);
    });
  }, []);

  const retry = useCallback(async <T>(fn: () => Promise<T> | T): Promise<T> => {
    if (retryCount >= maxRetries) {
      onMaxRetriesReached?.();
      throw new Error(`Maximum retry attempts (${maxRetries}) reached`);
    }

    setIsRetrying(true);

    try {
      // If this is a retry (not the first attempt), wait before retrying
      if (retryCount > 0) {
        const retryDelay = delay * Math.pow(backoffMultiplier, retryCount - 1);
        await sleep(retryDelay);
      }

      onRetry?.(retryCount + 1);
      const result = await Promise.resolve(fn());
      
      // Success - reset retry count
      setRetryCount(0);
      setIsRetrying(false);
      return result;
    } catch (error) {
      const newRetryCount = retryCount + 1;
      setRetryCount(newRetryCount);
      setIsRetrying(false);

      if (newRetryCount >= maxRetries) {
        onMaxRetriesReached?.();
        throw error;
      }

      // Don't throw on intermediate failures, let the caller decide to retry
      throw error;
    }
  }, [retryCount, maxRetries, delay, backoffMultiplier, onRetry, onMaxRetriesReached, sleep]);

  const canRetry = retryCount < maxRetries;

  return {
    retry,
    retryCount,
    isRetrying,
    reset,
    canRetry,
  };
};

/**
 * Hook for automatic retry with exponential backoff
 * Automatically retries failed operations without manual intervention
 */
export const useAutoRetry = <T>(
  fn: () => Promise<T>,
  dependencies: React.DependencyList,
  options: UseRetryOptions & { enabled?: boolean } = {}
) => {
  const { enabled = true, ...retryOptions } = options;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { retry, retryCount, isRetrying, reset } = useRetry({
    ...retryOptions,
    onMaxRetriesReached: () => {
      setIsLoading(false);
      options.onMaxRetriesReached?.();
    },
  });

  const execute = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await retry(fn);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, retry, fn]);

  // Execute on dependency changes
  React.useEffect(() => {
    execute();
  }, dependencies);

  const manualRetry = useCallback(() => {
    reset();
    execute();
  }, [reset, execute]);

  return {
    data,
    error,
    isLoading: isLoading || isRetrying,
    retryCount,
    retry: manualRetry,
    reset,
  };
};

export default useRetry;