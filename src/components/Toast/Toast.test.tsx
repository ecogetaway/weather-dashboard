import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Toast from './Toast';

describe('Toast', () => {
  const defaultProps = {
    id: 'test-toast',
    type: 'info' as const,
    title: 'Test Toast',
    onClose: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with basic props', () => {
    render(<Toast {...defaultProps} />);
    
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Test Toast')).toBeInTheDocument();
  });

  it('displays the correct icon for each type', () => {
    const types = [
      { type: 'success' as const, icon: '✅' },
      { type: 'error' as const, icon: '❌' },
      { type: 'warning' as const, icon: '⚠️' },
      { type: 'info' as const, icon: 'ℹ️' }
    ];

    types.forEach(({ type, icon }) => {
      const { unmount } = render(<Toast {...defaultProps} type={type} />);
      expect(screen.getByText(icon)).toBeInTheDocument();
      unmount();
    });
  });

  it('displays message when provided', () => {
    render(<Toast {...defaultProps} message="This is a test message" />);
    
    expect(screen.getByText('This is a test message')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<Toast {...defaultProps} />);
    
    const closeButton = screen.getByRole('button', { name: /close notification/i });
    fireEvent.click(closeButton);
    
    expect(defaultProps.onClose).toHaveBeenCalledWith('test-toast');
  });

  it('displays action button when provided', () => {
    const action = {
      label: 'Retry',
      onClick: vi.fn()
    };

    render(<Toast {...defaultProps} action={action} />);
    
    const actionButton = screen.getByRole('button', { name: 'Retry' });
    expect(actionButton).toBeInTheDocument();
    
    fireEvent.click(actionButton);
    expect(action.onClick).toHaveBeenCalled();
  });

  it('auto-closes after specified duration', async () => {
    render(<Toast {...defaultProps} duration={100} />);
    
    await waitFor(() => {
      expect(defaultProps.onClose).toHaveBeenCalledWith('test-toast');
    }, { timeout: 500 });
  });

  it('does not auto-close when duration is 0', async () => {
    render(<Toast {...defaultProps} duration={0} />);
    
    // Wait a bit to ensure it doesn't auto-close
    await new Promise(resolve => setTimeout(resolve, 200));
    
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('shows progress bar when duration is set', () => {
    render(<Toast {...defaultProps} duration={5000} />);
    
    const progressBar = document.querySelector('[class*="progressBar"]');
    expect(progressBar).toBeInTheDocument();
  });

  it('does not show progress bar when duration is 0', () => {
    render(<Toast {...defaultProps} duration={0} />);
    
    const progressBar = document.querySelector('[class*="progressBar"]');
    expect(progressBar).not.toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<Toast {...defaultProps} />);
    
    const toast = screen.getByRole('alert');
    expect(toast).toHaveAttribute('aria-live', 'polite');
    expect(toast).toHaveAttribute('aria-atomic', 'true');
  });

  it('applies correct CSS classes for different types', () => {
    const { rerender } = render(<Toast {...defaultProps} type="success" />);
    
    let toast = screen.getByRole('alert');
    expect(toast).toHaveClass('success');
    
    rerender(<Toast {...defaultProps} type="error" />);
    toast = screen.getByRole('alert');
    expect(toast).toHaveClass('error');
  });

  it('handles entrance and exit animations', async () => {
    render(<Toast {...defaultProps} />);
    
    const toast = screen.getByRole('alert');
    
    // Should start without visible class
    expect(toast).not.toHaveClass('visible');
    
    // Should become visible after a short delay
    await waitFor(() => {
      expect(toast).toHaveClass('visible');
    });
  });

  it('pauses progress bar animation when exiting', async () => {
    render(<Toast {...defaultProps} duration={1000} />);
    
    const closeButton = screen.getByRole('button', { name: /close notification/i });
    fireEvent.click(closeButton);
    
    const progressBar = document.querySelector('[class*="progressBar"]');
    if (progressBar) {
      await waitFor(() => {
        expect(progressBar).toHaveStyle('animation-play-state: paused');
      });
    }
  });
});