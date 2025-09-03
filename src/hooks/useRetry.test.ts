import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useRetry, useAutoRetry } from './useRetry';

describe('useRetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns initial state correctly', () => {
    const { result } = renderHook(() => useRetry());

    expect(result.current.retryCount).toBe(0);
    expect(result.current.isRetrying).toBe(false);
    expect(result.current.canRetry).toBe(true);
  });

  it('executes function successfully on first attempt', async () => {
    const mockFn = vi.fn().mockResolvedValue('success');
    const { result } = renderHook(() => useRetry());

    let resultValue;
    await act(async () => {
      resultValue = await result.current.retry(mockFn);
    });

    expect(resultValue).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(result.current.retryCount).toBe(0);
    expect(result.current.isRetrying).toBe(false);
  });

  it('increments retry count on failure', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('Test error'));
    const { result } = renderHook(() => useRetry({ maxRetries: 3 }));

    try {
      await act(async () => {
        await result.current.retry(mockFn);
      });
    } catch (error) {
      // Expected to throw
    }

    expect(result.current.retryCount).toBe(1);
    expect(result.current.isRetrying).toBe(false);
    expect(result.current.canRetry).toBe(true);
  });

  it('respects maxRetries limit', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('Test error'));
    const { result } = renderHook(() => useRetry({ maxRetries: 2 }));

    // First failure
    try {
      await act(async () => {
        await result.current.retry(mockFn);
      });
    } catch (error) {
      // Expected
    }

    expect(result.current.retryCount).toBe(1);
    expect(result.current.canRetry).toBe(true);

    // Second failure
    try {
      await act(async () => {
        await result.current.retry(mockFn);
      });
    } catch (error) {
      // Expected
    }

    expect(result.current.retryCount).toBe(2);
    expect(result.current.canRetry).toBe(false);

    // Third attempt should throw immediately
    try {
      await act(async () => {
        await result.current.retry(mockFn);
      });
    } catch (error) {
      expect(error.message).toContain('Maximum retry attempts');
    }
  });

  it('implements exponential backoff delay', async () => {
    const mockFn = vi.fn()
      .mockRejectedValueOnce(new Error('First failure'))
      .mockResolvedValueOnce('success');

    const { result } = renderHook(() => useRetry({
      maxRetries: 3,
      delay: 1000,
      backoffMultiplier: 2
    }));

    // First attempt fails
    try {
      await act(async () => {
        await result.current.retry(mockFn);
      });
    } catch (error) {
      // Expected
    }

    expect(result.current.retryCount).toBe(1);

    // Second attempt should wait for delay
    const retryPromise = act(async () => {
      return result.current.retry(mockFn);
    });

    // Fast-forward time to trigger the delay
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    const resultValue = await retryPromise;
    expect(resultValue).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('calls onRetry callback with attempt number', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('Test error'));
    const onRetry = vi.fn();
    const { result } = renderHook(() => useRetry({ onRetry, maxRetries: 2 }));

    try {
      await act(async () => {
        await result.current.retry(mockFn);
      });
    } catch (error) {
      // Expected
    }

    expect(onRetry).toHaveBeenCalledWith(1);
  });

  it('calls onMaxRetriesReached when limit exceeded', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('Test error'));
    const onMaxRetriesReached = vi.fn();
    const { result } = renderHook(() => useRetry({ 
      maxRetries: 1, 
      onMaxRetriesReached 
    }));

    // First failure
    try {
      await act(async () => {
        await result.current.retry(mockFn);
      });
    } catch (error) {
      // Expected
    }

    // Second attempt should trigger max retries
    try {
      await act(async () => {
        await result.current.retry(mockFn);
      });
    } catch (error) {
      // Expected
    }

    expect(onMaxRetriesReached).toHaveBeenCalled();
  });

  it('resets state correctly', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('Test error'));
    const { result } = renderHook(() => useRetry());

    // Cause a failure
    try {
      await act(async () => {
        await result.current.retry(mockFn);
      });
    } catch (error) {
      // Expected
    }

    expect(result.current.retryCount).toBe(1);

    // Reset
    act(() => {
      result.current.reset();
    });

    expect(result.current.retryCount).toBe(0);
    expect(result.current.isRetrying).toBe(false);
    expect(result.current.canRetry).toBe(true);
  });

  it('handles synchronous functions', async () => {
    const mockFn = vi.fn().mockReturnValue('sync result');
    const { result } = renderHook(() => useRetry());

    let resultValue;
    await act(async () => {
      resultValue = await result.current.retry(mockFn);
    });

    expect(resultValue).toBe('sync result');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});

describe('useAutoRetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('executes function automatically on mount', async () => {
    const mockFn = vi.fn().mockResolvedValue('auto result');
    
    const { result } = renderHook(() => 
      useAutoRetry(mockFn, [], { enabled: true })
    );

    // Wait for async execution
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(result.current.data).toBe('auto result');
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('does not execute when disabled', () => {
    const mockFn = vi.fn().mockResolvedValue('result');
    
    renderHook(() => 
      useAutoRetry(mockFn, [], { enabled: false })
    );

    expect(mockFn).not.toHaveBeenCalled();
  });

  it('retries automatically on failure', async () => {
    const mockFn = vi.fn()
      .mockRejectedValueOnce(new Error('First failure'))
      .mockResolvedValueOnce('success');

    const { result } = renderHook(() => 
      useAutoRetry(mockFn, [], { 
        enabled: true,
        maxRetries: 2,
        delay: 100
      })
    );

    // Wait for initial execution and retry
    await act(async () => {
      vi.advanceTimersByTime(200);
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(mockFn).toHaveBeenCalledTimes(2);
    expect(result.current.data).toBe('success');
    expect(result.current.error).toBeNull();
  });

  it('sets error state when max retries exceeded', async () => {
    const error = new Error('Persistent failure');
    const mockFn = vi.fn().mockRejectedValue(error);

    const { result } = renderHook(() => 
      useAutoRetry(mockFn, [], { 
        enabled: true,
        maxRetries: 1,
        delay: 100
      })
    );

    // Wait for execution and retries
    await act(async () => {
      vi.advanceTimersByTime(200);
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toEqual(error);
    expect(result.current.isLoading).toBe(false);
  });

  it('re-executes when dependencies change', async () => {
    const mockFn = vi.fn().mockResolvedValue('result');
    let dependency = 'initial';

    const { rerender } = renderHook(() => 
      useAutoRetry(mockFn, [dependency], { enabled: true })
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(mockFn).toHaveBeenCalledTimes(1);

    // Change dependency
    dependency = 'changed';
    rerender();

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('provides manual retry function', async () => {
    const mockFn = vi.fn().mockResolvedValue('manual result');
    
    const { result } = renderHook(() => 
      useAutoRetry(mockFn, [], { enabled: false })
    );

    expect(mockFn).not.toHaveBeenCalled();

    // Manual retry
    await act(async () => {
      result.current.retry();
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(result.current.data).toBe('manual result');
  });
});