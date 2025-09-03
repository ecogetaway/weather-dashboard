import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import RetryButton from './RetryButton';

// Mock dependencies
vi.mock('@/hooks/useRetry', () => ({
  useRetry: vi.fn(() => ({
    retry: vi.fn(),
    retryCount: 0,
    isRetrying: false,
    reset: vi.fn(),
    canRetry: true
  }))
}));

vi.mock('@/components/LoadingSpinner/LoadingSpinner', () => ({
  default: ({ size, className }: any) => (
    <div data-testid="loading-spinner" className={className}>
      Loading {size}
    </div>
  )
}));

describe('RetryButton', () => {
  const mockRetry = vi.fn();
  const mockReset = vi.fn();
  const mockOnRetry = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    const { useRetry } = require('@/hooks/useRetry');
    vi.mocked(useRetry).mockReturnValue({
      retry: mockRetry,
      retryCount: 0,
      isRetrying: false,
      reset: mockReset,
      canRetry: true
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders with default props', () => {
    render(<RetryButton onRetry={mockOnRetry} />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Retry');
    expect(button).not.toBeDisabled();
  });

  it('renders with custom children', () => {
    render(<RetryButton onRetry={mockOnRetry}>Custom Retry Text</RetryButton>);
    
    expect(screen.getByText('Custom Retry Text')).toBeInTheDocument();
  });

  it('applies size classes correctly', () => {
    const { rerender } = render(<RetryButton onRetry={mockOnRetry} size="small" />);
    expect(screen.getByRole('button')).toHaveClass('small');
    
    rerender(<RetryButton onRetry={mockOnRetry} size="medium" />);
    expect(screen.getByRole('button')).toHaveClass('medium');
    
    rerender(<RetryButton onRetry={mockOnRetry} size="large" />);
    expect(screen.getByRole('button')).toHaveClass('large');
  });

  it('applies variant classes correctly', () => {
    const { rerender } = render(<RetryButton onRetry={mockOnRetry} variant="primary" />);
    expect(screen.getByRole('button')).toHaveClass('primary');
    
    rerender(<RetryButton onRetry={mockOnRetry} variant="secondary" />);
    expect(screen.getByRole('button')).toHaveClass('secondary');
    
    rerender(<RetryButton onRetry={mockOnRetry} variant="outline" />);
    expect(screen.getByRole('button')).toHaveClass('outline');
  });

  it('applies custom className', () => {
    render(<RetryButton onRetry={mockOnRetry} className="custom-class" />);
    
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });

  it('is disabled when disabled prop is true', () => {
    render(<RetryButton onRetry={mockOnRetry} disabled={true} />);
    
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows loading state when isRetrying is true', async () => {
    const { useRetry } = await import('@/hooks/useRetry');
    vi.mocked(useRetry).mockReturnValue({
      retry: mockRetry,
      retryCount: 1,
      isRetrying: true,
      reset: mockReset,
      canRetry: true
    });

    render(<RetryButton onRetry={mockOnRetry} />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByText('Retrying... (1/3)')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveClass('loading');
  });

  it('shows retry count in button text', async () => {
    const { useRetry } = await import('@/hooks/useRetry');
    vi.mocked(useRetry).mockReturnValue({
      retry: mockRetry,
      retryCount: 2,
      isRetrying: false,
      reset: mockReset,
      canRetry: true
    });

    render(<RetryButton onRetry={mockOnRetry} maxRetries={5} />);
    
    expect(screen.getByText('Retry (2/5)')).toBeInTheDocument();
  });

  it('shows max retries reached state', async () => {
    const { useRetry } = await import('@/hooks/useRetry');
    vi.mocked(useRetry).mockReturnValue({
      retry: mockRetry,
      retryCount: 3,
      isRetrying: false,
      reset: mockReset,
      canRetry: false
    });

    render(<RetryButton onRetry={mockOnRetry} maxRetries={3} />);
    
    expect(screen.getByText('Max retries reached')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('calls onRetry when clicked', async () => {
    mockRetry.mockResolvedValue(undefined);
    
    render(<RetryButton onRetry={mockOnRetry} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(mockRetry).toHaveBeenCalledWith(mockOnRetry);
    });
  });

  it('does not call onRetry when disabled', () => {
    render(<RetryButton onRetry={mockOnRetry} disabled={true} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(mockRetry).not.toHaveBeenCalled();
  });

  it('does not call onRetry when loading', async () => {
    const { useRetry } = await import('@/hooks/useRetry');
    vi.mocked(useRetry).mockReturnValue({
      retry: mockRetry,
      retryCount: 0,
      isRetrying: true,
      reset: mockReset,
      canRetry: true
    });

    render(<RetryButton onRetry={mockOnRetry} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(mockRetry).not.toHaveBeenCalled();
  });

  it('does not call onRetry when max retries reached', async () => {
    const { useRetry } = await import('@/hooks/useRetry');
    vi.mocked(useRetry).mockReturnValue({
      retry: mockRetry,
      retryCount: 3,
      isRetrying: false,
      reset: mockReset,
      canRetry: false
    });

    render(<RetryButton onRetry={mockOnRetry} maxRetries={3} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(mockRetry).not.toHaveBeenCalled();
  });

  it('handles async onRetry function', async () => {
    const asyncOnRetry = vi.fn().mockResolvedValue('success');
    mockRetry.mockImplementation(async (fn) => {
      return await fn();
    });
    
    render(<RetryButton onRetry={asyncOnRetry} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(asyncOnRetry).toHaveBeenCalled();
    });
  });

  it('handles onRetry function that throws error', async () => {
    const errorOnRetry = vi.fn().mockRejectedValue(new Error('Test error'));
    mockRetry.mockImplementation(async (fn) => {
      await fn();
    });
    
    render(<RetryButton onRetry={errorOnRetry} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(errorOnRetry).toHaveBeenCalled();
    });
  });

  it('uses custom maxRetries value', () => {
    render(<RetryButton onRetry={mockOnRetry} maxRetries={5} />);
    
    const { useRetry } = require('@/hooks/useRetry');
    expect(useRetry).toHaveBeenCalledWith({
      maxRetries: 5,
      delay: 1000
    });
  });

  it('uses custom retryDelay value', () => {
    render(<RetryButton onRetry={mockOnRetry} retryDelay={2000} />);
    
    const { useRetry } = require('@/hooks/useRetry');
    expect(useRetry).toHaveBeenCalledWith({
      maxRetries: 3,
      delay: 2000
    });
  });

  it('has proper accessibility attributes', () => {
    render(<RetryButton onRetry={mockOnRetry} aria-label="Custom retry label" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Custom retry label');
  });

  it('generates default aria-label with retry count', async () => {
    const { useRetry } = await import('@/hooks/useRetry');
    vi.mocked(useRetry).mockReturnValue({
      retry: mockRetry,
      retryCount: 1,
      isRetrying: false,
      reset: mockReset,
      canRetry: true
    });

    render(<RetryButton onRetry={mockOnRetry} maxRetries={3} />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Retry, attempt 2 of 3');
  });

  it('shows screen reader status when retrying', async () => {
    const { useRetry } = await import('@/hooks/useRetry');
    vi.mocked(useRetry).mockReturnValue({
      retry: mockRetry,
      retryCount: 1,
      isRetrying: true,
      reset: mockReset,
      canRetry: true
    });

    render(<RetryButton onRetry={mockOnRetry} />);
    
    expect(screen.getByText('Retrying operation, please wait')).toBeInTheDocument();
  });

  it('handles synchronous onRetry function', async () => {
    const syncOnRetry = vi.fn().mockReturnValue('sync result');
    mockRetry.mockImplementation((fn) => fn());
    
    render(<RetryButton onRetry={syncOnRetry} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(syncOnRetry).toHaveBeenCalled();
    });
  });
});