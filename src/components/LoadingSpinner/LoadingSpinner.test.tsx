import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import LoadingSpinner from './LoadingSpinner';
import styles from './LoadingSpinner.module.css';

describe('LoadingSpinner', () => {
  it('should render with default props', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute('aria-label', 'Loading...');
    expect(spinner).toHaveAttribute('aria-live', 'polite');
  });

  it('should render with custom aria-label', () => {
    const customLabel = 'Fetching weather data...';
    render(<LoadingSpinner aria-label={customLabel} />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('aria-label', customLabel);
    
    const srText = screen.getByText(customLabel);
    expect(srText).toBeInTheDocument();
  });

  it('should apply size classes correctly', () => {
    const { rerender } = render(<LoadingSpinner size="small" />);
    let spinner = screen.getByRole('status');
    expect(spinner).toHaveClass(styles.small);

    rerender(<LoadingSpinner size="medium" />);
    spinner = screen.getByRole('status');
    expect(spinner).toHaveClass(styles.medium);

    rerender(<LoadingSpinner size="large" />);
    spinner = screen.getByRole('status');
    expect(spinner).toHaveClass(styles.large);
  });

  it('should apply custom className', () => {
    const customClass = 'custom-spinner';
    render(<LoadingSpinner className={customClass} />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass(customClass);
  });

  it('should apply custom color style', () => {
    const customColor = '#ff0000';
    render(<LoadingSpinner color={customColor} />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveStyle({ borderTopColor: customColor });
  });

  it('should have default medium size when no size specified', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass(styles.medium);
  });

  it('should contain screen reader text', () => {
    render(<LoadingSpinner />);
    
    const srText = screen.getByText('Loading...');
    expect(srText).toBeInTheDocument();
    expect(srText).toHaveClass(styles.srOnly);
  });

  it('should be accessible with proper ARIA attributes', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('role', 'status');
    expect(spinner).toHaveAttribute('aria-live', 'polite');
    expect(spinner).toHaveAttribute('aria-label');
  });

  it('should render container with proper structure', () => {
    render(<LoadingSpinner />);
    
    const container = screen.getByRole('status').parentElement;
    expect(container).toHaveClass(styles.container);
  });

  it('should handle all size variants', () => {
    const sizes = ['small', 'medium', 'large'] as const;
    
    sizes.forEach(size => {
      const { unmount } = render(<LoadingSpinner size={size} />);
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass(styles[size]);
      unmount();
    });
  });

  it('should combine multiple classes correctly', () => {
    const customClass = 'my-custom-class';
    render(<LoadingSpinner size="large" className={customClass} />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass(styles.spinner);
    expect(spinner).toHaveClass(styles.large);
    expect(spinner).toHaveClass(customClass);
  });
});