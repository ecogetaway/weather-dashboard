import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import OfflineIndicator from './OfflineIndicator';

// Mock dependencies
vi.mock('@/hooks/useNetworkStatus', () => ({
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

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

describe('OfflineIndicator', () => {
  const mockToastHelpers = {
    showSuccess: vi.fn(),
    showError: vi.fn(),
    showInfo: vi.fn(),
    showWarning: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    navigator.onLine = true;
    
    // Setup default mocks
    const { useToastHelpers } = require('@/contexts/ToastContext');
    vi.mocked(useToastHelpers).mockReturnValue(mockToastHelpers);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not render when online and no slow connection', () => {
    const { container } = render(<OfflineIndicator />);
    expect(container.firstChild).toBeNull();
  });

  it('renders when offline', async () => {
    const { useNetworkStatus, useOnlineStatus } = await import('@/hooks/useNetworkStatus');
    
    vi.mocked(useNetworkStatus).mockReturnValue({
      isOnline: false,
      isSlowConnection: false,
      connectionType: 'none',
      effectiveType: 'none',
      downlink: 0,
      rtt: 0
    });

    vi.mocked(useOnlineStatus).mockReturnValue({
      isOnline: false,
      wasOffline: true
    });

    render(<OfflineIndicator />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('renders when connection is slow', async () => {
    const { useNetworkStatus } = await import('@/hooks/useNetworkStatus');
    
    vi.mocked(useNetworkStatus).mockReturnValue({
      isOnline: true,
      isSlowConnection: true,
      connectionType: 'cellular',
      effectiveType: '2g',
      downlink: 0.5,
      rtt: 300
    });

    render(<OfflineIndicator showConnectionQuality={true} />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Slow connection')).toBeInTheDocument();
  });

  it('shows connection quality information', async () => {
    const { useNetworkStatus } = await import('@/hooks/useNetworkStatus');
    
    vi.mocked(useNetworkStatus).mockReturnValue({
      isOnline: true,
      isSlowConnection: true,
      connectionType: 'cellular',
      effectiveType: '2g',
      downlink: 0.5,
      rtt: 300
    });

    render(<OfflineIndicator showConnectionQuality={true} />);
    
    expect(screen.getByText('Fair')).toBeInTheDocument();
    expect(screen.getByText('0.5 Mbps')).toBeInTheDocument();
  });

  it('displays retry button when offline and callback provided', async () => {
    const { useNetworkStatus, useOnlineStatus } = await import('@/hooks/useNetworkStatus');
    const onRetry = vi.fn();
    
    vi.mocked(useNetworkStatus).mockReturnValue({
      isOnline: false,
      isSlowConnection: false,
      connectionType: 'none',
      effectiveType: 'none',
      downlink: 0,
      rtt: 0
    });

    vi.mocked(useOnlineStatus).mockReturnValue({
      isOnline: false,
      wasOffline: true
    });

    render(<OfflineIndicator onRetryOfflineRequests={onRetry} />);
    
    const retryButton = screen.getByRole('button', { name: /retry offline requests/i });
    expect(retryButton).toBeInTheDocument();
    
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalled();
  });

  it('shows offline message when offline', async () => {
    const { useNetworkStatus, useOnlineStatus } = await import('@/hooks/useNetworkStatus');
    
    vi.mocked(useNetworkStatus).mockReturnValue({
      isOnline: false,
      isSlowConnection: false,
      connectionType: 'none',
      effectiveType: 'none',
      downlink: 0,
      rtt: 0
    });

    vi.mocked(useOnlineStatus).mockReturnValue({
      isOnline: false,
      wasOffline: true
    });

    render(<OfflineIndicator />);
    
    expect(screen.getByText(/you're currently offline/i)).toBeInTheDocument();
    expect(screen.getByText(/cached weather data is being shown/i)).toBeInTheDocument();
  });

  it('shows "Back online" state when just came online', async () => {
    const { useNetworkStatus, useOnlineStatus } = await import('@/hooks/useNetworkStatus');
    
    vi.mocked(useNetworkStatus).mockReturnValue({
      isOnline: true,
      isSlowConnection: false,
      connectionType: 'wifi',
      effectiveType: '4g',
      downlink: 2.5,
      rtt: 50
    });

    vi.mocked(useOnlineStatus).mockReturnValue({
      isOnline: true,
      wasOffline: true
    });

    render(<OfflineIndicator />);
    
    expect(screen.getByText('Back online')).toBeInTheDocument();
  });

  it('shows success toast when coming back online', async () => {
    const { useNetworkStatus, useOnlineStatus } = await import('@/hooks/useNetworkStatus');
    const onRetry = vi.fn();
    
    vi.mocked(useNetworkStatus).mockReturnValue({
      isOnline: true,
      isSlowConnection: false,
      connectionType: 'wifi',
      effectiveType: '4g',
      downlink: 2.5,
      rtt: 50
    });

    vi.mocked(useOnlineStatus).mockReturnValue({
      isOnline: true,
      wasOffline: true
    });

    render(<OfflineIndicator onRetryOfflineRequests={onRetry} />);
    
    await waitFor(() => {
      expect(mockToastHelpers.showSuccess).toHaveBeenCalledWith(
        'Back online!',
        'Your internet connection has been restored.',
        expect.objectContaining({
          action: expect.objectContaining({
            label: 'Retry',
            onClick: onRetry
          })
        })
      );
    });
  });

  it('shows warning toast for slow connections', async () => {
    const { useNetworkStatus } = await import('@/hooks/useNetworkStatus');
    
    vi.mocked(useNetworkStatus).mockReturnValue({
      isOnline: true,
      isSlowConnection: true,
      connectionType: 'cellular',
      effectiveType: '2g',
      downlink: 0.5,
      rtt: 300
    });

    render(<OfflineIndicator />);
    
    await waitFor(() => {
      expect(mockToastHelpers.showWarning).toHaveBeenCalledWith(
        'Slow connection detected',
        'You may experience delays loading weather data.',
        { duration: 3000 }
      );
    });
  });

  it('shows info toast when going offline', async () => {
    const { useNetworkStatus, useOnlineStatus } = await import('@/hooks/useNetworkStatus');
    
    vi.mocked(useNetworkStatus).mockReturnValue({
      isOnline: false,
      isSlowConnection: false,
      connectionType: 'none',
      effectiveType: 'none',
      downlink: 0,
      rtt: 0
    });

    vi.mocked(useOnlineStatus).mockReturnValue({
      isOnline: false,
      wasOffline: true
    });

    render(<OfflineIndicator />);
    
    await waitFor(() => {
      expect(mockToastHelpers.showInfo).toHaveBeenCalledWith(
        'You\'re offline',
        'Showing cached weather data. Some features may be limited.',
        { duration: 0 }
      );
    });
  });

  it('applies custom className', async () => {
    const { useNetworkStatus, useOnlineStatus } = await import('@/hooks/useNetworkStatus');
    
    vi.mocked(useNetworkStatus).mockReturnValue({
      isOnline: false,
      isSlowConnection: false,
      connectionType: 'none',
      effectiveType: 'none',
      downlink: 0,
      rtt: 0
    });

    vi.mocked(useOnlineStatus).mockReturnValue({
      isOnline: false,
      wasOffline: true
    });

    const { container } = render(<OfflineIndicator className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('gets correct connection quality for different speeds', async () => {
    const { useNetworkStatus } = await import('@/hooks/useNetworkStatus');
    
    // Test excellent connection
    vi.mocked(useNetworkStatus).mockReturnValue({
      isOnline: true,
      isSlowConnection: false,
      connectionType: 'wifi',
      effectiveType: '4g',
      downlink: 3.0,
      rtt: 20
    });

    const { rerender } = render(<OfflineIndicator showConnectionQuality={true} />);
    expect(screen.getByText('Excellent')).toBeInTheDocument();

    // Test good connection
    vi.mocked(useNetworkStatus).mockReturnValue({
      isOnline: true,
      isSlowConnection: false,
      connectionType: 'wifi',
      effectiveType: '4g',
      downlink: 1.0,
      rtt: 50
    });

    rerender(<OfflineIndicator showConnectionQuality={true} />);
    expect(screen.getByText('Good')).toBeInTheDocument();

    // Test fair connection
    vi.mocked(useNetworkStatus).mockReturnValue({
      isOnline: true,
      isSlowConnection: false,
      connectionType: 'cellular',
      effectiveType: '3g',
      downlink: 0.5,
      rtt: 100
    });

    rerender(<OfflineIndicator showConnectionQuality={true} />);
    expect(screen.getByText('Fair')).toBeInTheDocument();

    // Test poor connection
    vi.mocked(useNetworkStatus).mockReturnValue({
      isOnline: true,
      isSlowConnection: true,
      connectionType: 'cellular',
      effectiveType: 'slow-2g',
      downlink: 0.1,
      rtt: 500
    });

    rerender(<OfflineIndicator showConnectionQuality={true} />);
    expect(screen.getByText('Poor')).toBeInTheDocument();
  });

  it('hides connection quality when showConnectionQuality is false', async () => {
    const { useNetworkStatus } = await import('@/hooks/useNetworkStatus');
    
    vi.mocked(useNetworkStatus).mockReturnValue({
      isOnline: true,
      isSlowConnection: true,
      connectionType: 'cellular',
      effectiveType: '2g',
      downlink: 0.5,
      rtt: 300
    });

    render(<OfflineIndicator showConnectionQuality={false} />);
    
    expect(screen.queryByText('Fair')).not.toBeInTheDocument();
    expect(screen.queryByText('0.5 Mbps')).not.toBeInTheDocument();
  });
});