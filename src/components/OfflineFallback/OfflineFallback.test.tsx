import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import OfflineFallback from './OfflineFallback';

// Mock dependencies
vi.mock('@/hooks/useOfflineManager', () => ({
  useOfflineManager: vi.fn(() => ({
    isOffline: true,
    hasOfflineData: true,
    processOfflineQueue: vi.fn()
  }))
}));

vi.mock('@/components/RetryButton/RetryButton', () => ({
  default: ({ onRetry, children, ...props }: any) => (
    <button onClick={onRetry} {...props}>
      {children}
    </button>
  )
}));

describe('OfflineFallback', () => {
  const mockProcessOfflineQueue = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    const { useOfflineManager } = require('@/hooks/useOfflineManager');
    vi.mocked(useOfflineManager).mockReturnValue({
      isOffline: true,
      hasOfflineData: true,
      processOfflineQueue: mockProcessOfflineQueue
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not render when online', async () => {
    const { useOfflineManager } = await import('@/hooks/useOfflineManager');
    vi.mocked(useOfflineManager).mockReturnValue({
      isOffline: false,
      hasOfflineData: true,
      processOfflineQueue: mockProcessOfflineQueue
    });

    const { container } = render(<OfflineFallback />);
    expect(container.firstChild).toBeNull();
  });

  it('renders offline fallback when offline', () => {
    render(<OfflineFallback />);
    
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('You\'re offline')).toBeInTheDocument();
  });

  it('shows cached data message when showCachedData is true', () => {
    render(<OfflineFallback showCachedData={true} />);
    
    expect(screen.getByText('Showing cached data')).toBeInTheDocument();
    expect(screen.getByText(/weather data may not be up to date/i)).toBeInTheDocument();
  });

  it('shows no cached data message when showCachedData is false', () => {
    render(<OfflineFallback showCachedData={false} />);
    
    expect(screen.getByText('You\'re offline')).toBeInTheDocument();
    expect(screen.getByText(/cannot load weather data/i)).toBeInTheDocument();
  });

  it('includes location name in messages when provided', () => {
    render(<OfflineFallback locationName="New York" showCachedData={true} />);
    
    expect(screen.getByText(/weather data for new york/i)).toBeInTheDocument();
  });

  it('includes location name in offline message when provided', () => {
    render(<OfflineFallback locationName="London" showCachedData={false} />);
    
    expect(screen.getByText(/cannot load weather data for london/i)).toBeInTheDocument();
  });

  it('shows cache notice when displaying cached data', () => {
    render(<OfflineFallback showCachedData={true} />);
    
    expect(screen.getByText(/this data was cached when you were last online/i)).toBeInTheDocument();
  });

  it('does not show cache notice when not displaying cached data', () => {
    render(<OfflineFallback showCachedData={false} />);
    
    expect(screen.queryByText(/this data was cached/i)).not.toBeInTheDocument();
  });

  it('shows info about available cached data when hasOfflineData is true', async () => {
    const { useOfflineManager } = await import('@/hooks/useOfflineManager');
    vi.mocked(useOfflineManager).mockReturnValue({
      isOffline: true,
      hasOfflineData: true,
      processOfflineQueue: mockProcessOfflineQueue
    });

    render(<OfflineFallback showCachedData={false} />);
    
    expect(screen.getByText(/some cached weather data is available/i)).toBeInTheDocument();
  });

  it('does not show cached data info when hasOfflineData is false', async () => {
    const { useOfflineManager } = await import('@/hooks/useOfflineManager');
    vi.mocked(useOfflineManager).mockReturnValue({
      isOffline: true,
      hasOfflineData: false,
      processOfflineQueue: mockProcessOfflineQueue
    });

    render(<OfflineFallback showCachedData={false} />);
    
    expect(screen.queryByText(/some cached weather data is available/i)).not.toBeInTheDocument();
  });

  it('calls custom onRetry when provided', () => {
    const customRetry = vi.fn();
    render(<OfflineFallback onRetry={customRetry} />);
    
    const retryButton = screen.getByRole('button');
    fireEvent.click(retryButton);
    
    expect(customRetry).toHaveBeenCalled();
    expect(mockProcessOfflineQueue).not.toHaveBeenCalled();
  });

  it('calls processOfflineQueue when no custom onRetry provided', () => {
    render(<OfflineFallback />);
    
    const retryButton = screen.getByRole('button');
    fireEvent.click(retryButton);
    
    expect(mockProcessOfflineQueue).toHaveBeenCalled();
  });

  it('shows correct button text for cached data', () => {
    render(<OfflineFallback showCachedData={true} />);
    
    expect(screen.getByText('Refresh data')).toBeInTheDocument();
  });

  it('shows correct button text for no cached data', () => {
    render(<OfflineFallback showCachedData={false} />);
    
    expect(screen.getByText('Try again')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<OfflineFallback className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('applies correct CSS classes based on cached data state', () => {
    const { container, rerender } = render(<OfflineFallback showCachedData={true} />);
    
    expect(container.firstChild).toHaveClass('withCachedData');
    
    rerender(<OfflineFallback showCachedData={false} />);
    
    expect(container.firstChild).toHaveClass('noCachedData');
  });

  it('has proper accessibility attributes', () => {
    render(<OfflineFallback />);
    
    const fallback = screen.getByRole('alert');
    expect(fallback).toHaveAttribute('aria-live', 'polite');
  });

  it('renders with all props combined', () => {
    render(
      <OfflineFallback 
        locationName="Tokyo"
        showCachedData={true}
        onRetry={vi.fn()}
        className="test-class"
      />
    );
    
    expect(screen.getByText('Showing cached data')).toBeInTheDocument();
    expect(screen.getByText(/weather data for tokyo/i)).toBeInTheDocument();
    expect(screen.getByText('Refresh data')).toBeInTheDocument();
    expect(screen.getByText(/this data was cached/i)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('test-class');
  });
});