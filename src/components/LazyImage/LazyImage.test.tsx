import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LazyImage from './LazyImage';

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
});

beforeEach(() => {
  vi.clearAllMocks();
  window.IntersectionObserver = mockIntersectionObserver;
});

describe('LazyImage', () => {
  const defaultProps = {
    src: 'https://example.com/image.jpg',
    alt: 'Test image'
  };

  it('renders with basic props', () => {
    render(<LazyImage {...defaultProps} />);
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
  });

  it('shows placeholder while loading', () => {
    render(<LazyImage {...defaultProps} placeholder="https://example.com/placeholder.jpg" />);
    
    // Should show placeholder initially
    const placeholderImg = screen.getByRole('img', { name: '' });
    expect(placeholderImg).toHaveAttribute('src', 'https://example.com/placeholder.jpg');
  });

  it('shows spinner when no placeholder provided', () => {
    render(<LazyImage {...defaultProps} />);
    
    // Should show loading spinner
    const spinner = document.querySelector('[style*="animation"]');
    expect(spinner).toBeInTheDocument();
  });

  it('loads image eagerly when loading="eager"', () => {
    render(<LazyImage {...defaultProps} loading="eager" />);
    
    // Should load image immediately
    const img = screen.getByRole('img', { name: 'Test image' });
    expect(img).toHaveAttribute('src', 'https://example.com/image.jpg');
  });

  it('applies custom className', () => {
    render(<LazyImage {...defaultProps} className="custom-class" />);
    
    const container = document.querySelector('.custom-class');
    expect(container).toBeInTheDocument();
  });

  it('sets custom width and height', () => {
    render(<LazyImage {...defaultProps} width={100} height={200} />);
    
    const container = document.querySelector('[style*="width: 100"]');
    expect(container).toBeInTheDocument();
  });

  it('calls onLoad when image loads successfully', async () => {
    const onLoad = vi.fn();
    render(<LazyImage {...defaultProps} onLoad={onLoad} loading="eager" />);
    
    const img = screen.getByRole('img', { name: 'Test image' });
    
    // Simulate image load
    img.dispatchEvent(new Event('load'));
    
    await waitFor(() => {
      expect(onLoad).toHaveBeenCalledTimes(1);
    });
  });

  it('calls onError when image fails to load', async () => {
    const onError = vi.fn();
    render(<LazyImage {...defaultProps} onError={onError} loading="eager" />);
    
    const img = screen.getByRole('img', { name: 'Test image' });
    
    // Simulate image error
    img.dispatchEvent(new Event('error'));
    
    await waitFor(() => {
      expect(onError).toHaveBeenCalledTimes(1);
    });
  });

  it('shows fallback image on error', async () => {
    const fallback = 'https://example.com/fallback.jpg';
    render(<LazyImage {...defaultProps} fallback={fallback} loading="eager" />);
    
    const img = screen.getByRole('img', { name: 'Test image' });
    
    // Simulate image error
    img.dispatchEvent(new Event('error'));
    
    await waitFor(() => {
      expect(img).toHaveAttribute('src', fallback);
    });
  });

  it('shows error state when no fallback provided', async () => {
    render(<LazyImage {...defaultProps} loading="eager" />);
    
    const img = screen.getByRole('img', { name: 'Test image' });
    
    // Simulate image error
    img.dispatchEvent(new Event('error'));
    
    await waitFor(() => {
      expect(screen.getByText('❌')).toBeInTheDocument();
    });
  });

  it('sets up intersection observer for lazy loading', () => {
    render(<LazyImage {...defaultProps} />);
    
    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );
  });

  it('loads image when intersection observer triggers', async () => {
    let intersectionCallback: (entries: any[]) => void;
    
    mockIntersectionObserver.mockImplementation((callback) => {
      intersectionCallback = callback;
      return {
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      };
    });

    render(<LazyImage {...defaultProps} />);
    
    // Initially should not show the main image
    expect(screen.queryByRole('img', { name: 'Test image' })).not.toBeInTheDocument();
    
    // Simulate intersection
    intersectionCallback!([{ isIntersecting: true }]);
    
    await waitFor(() => {
      expect(screen.getByRole('img', { name: 'Test image' })).toBeInTheDocument();
    });
  });

  it('handles image transition opacity correctly', async () => {
    render(<LazyImage {...defaultProps} loading="eager" />);
    
    const img = screen.getByRole('img', { name: 'Test image' });
    
    // Initially should have opacity 0
    expect(img).toHaveStyle('opacity: 0');
    
    // Simulate image load
    img.dispatchEvent(new Event('load'));
    
    await waitFor(() => {
      expect(img).toHaveStyle('opacity: 1');
    });
  });

  it('cleans up intersection observer on unmount', () => {
    const disconnect = vi.fn();
    mockIntersectionObserver.mockReturnValue({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect,
    });

    const { unmount } = render(<LazyImage {...defaultProps} />);
    
    unmount();
    
    expect(disconnect).toHaveBeenCalled();
  });
});