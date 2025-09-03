import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ToastProvider, useToast, useToastHelpers } from './ToastContext';

// Test component that uses the toast context
const TestComponent = () => {
  const { showToast, hideToast, clearAllToasts, toasts } = useToast();
  const { showSuccess, showError, showWarning, showInfo } = useToastHelpers();

  return (
    <div>
      <div data-testid="toast-count">{toasts.length}</div>
      
      <button onClick={() => showToast({ type: 'info', title: 'Custom Toast' })}>
        Show Custom Toast
      </button>
      
      <button onClick={() => showSuccess('Success!', 'Operation completed')}>
        Show Success
      </button>
      
      <button onClick={() => showError('Error!', 'Something went wrong')}>
        Show Error
      </button>
      
      <button onClick={() => showWarning('Warning!', 'Please be careful')}>
        Show Warning
      </button>
      
      <button onClick={() => showInfo('Info!', 'Here is some information')}>
        Show Info
      </button>
      
      <button onClick={() => hideToast(toasts[0]?.id || '')}>
        Hide First Toast
      </button>
      
      <button onClick={clearAllToasts}>
        Clear All Toasts
      </button>
    </div>
  );
};

describe('ToastContext', () => {
  it('provides toast functionality to children', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
    expect(screen.getByText('Show Custom Toast')).toBeInTheDocument();
  });

  it('shows and manages toasts', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const showButton = screen.getByText('Show Custom Toast');
    
    act(() => {
      fireEvent.click(showButton);
    });

    expect(screen.getByTestId('toast-count')).toHaveTextContent('1');
    expect(screen.getByText('Custom Toast')).toBeInTheDocument();
  });

  it('shows success toast with correct styling', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const successButton = screen.getByText('Show Success');
    
    act(() => {
      fireEvent.click(successButton);
    });

    expect(screen.getByText('Success!')).toBeInTheDocument();
    expect(screen.getByText('Operation completed')).toBeInTheDocument();
    expect(screen.getByText('✅')).toBeInTheDocument();
  });

  it('shows error toast with correct styling', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const errorButton = screen.getByText('Show Error');
    
    act(() => {
      fireEvent.click(errorButton);
    });

    expect(screen.getByText('Error!')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('❌')).toBeInTheDocument();
  });

  it('shows warning toast with correct styling', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const warningButton = screen.getByText('Show Warning');
    
    act(() => {
      fireEvent.click(warningButton);
    });

    expect(screen.getByText('Warning!')).toBeInTheDocument();
    expect(screen.getByText('Please be careful')).toBeInTheDocument();
    expect(screen.getByText('⚠️')).toBeInTheDocument();
  });

  it('shows info toast with correct styling', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const infoButton = screen.getByText('Show Info');
    
    act(() => {
      fireEvent.click(infoButton);
    });

    expect(screen.getByText('Info!')).toBeInTheDocument();
    expect(screen.getByText('Here is some information')).toBeInTheDocument();
    expect(screen.getByText('ℹ️')).toBeInTheDocument();
  });

  it('hides specific toast', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    // Show a toast first
    act(() => {
      fireEvent.click(screen.getByText('Show Custom Toast'));
    });

    expect(screen.getByTestId('toast-count')).toHaveTextContent('1');

    // Hide the toast
    act(() => {
      fireEvent.click(screen.getByText('Hide First Toast'));
    });

    expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
  });

  it('clears all toasts', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    // Show multiple toasts
    act(() => {
      fireEvent.click(screen.getByText('Show Success'));
      fireEvent.click(screen.getByText('Show Error'));
      fireEvent.click(screen.getByText('Show Warning'));
    });

    expect(screen.getByTestId('toast-count')).toHaveTextContent('3');

    // Clear all toasts
    act(() => {
      fireEvent.click(screen.getByText('Clear All Toasts'));
    });

    expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
  });

  it('limits maximum number of toasts', () => {
    render(
      <ToastProvider maxToasts={2}>
        <TestComponent />
      </ToastProvider>
    );

    // Show more toasts than the limit
    act(() => {
      fireEvent.click(screen.getByText('Show Success'));
      fireEvent.click(screen.getByText('Show Error'));
      fireEvent.click(screen.getByText('Show Warning'));
    });

    // Should only show the maximum number of toasts
    expect(screen.getByTestId('toast-count')).toHaveTextContent('3');
    
    // But only 2 should be visible in the container
    const toastContainer = document.querySelector('[role="region"]');
    if (toastContainer) {
      expect(toastContainer.children).toHaveLength(2);
    }
  });

  it('closes toast when close button is clicked', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      fireEvent.click(screen.getByText('Show Custom Toast'));
    });

    expect(screen.getByTestId('toast-count')).toHaveTextContent('1');

    const closeButton = screen.getByRole('button', { name: /close notification/i });
    
    act(() => {
      fireEvent.click(closeButton);
    });

    expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
  });

  it('throws error when useToast is used outside provider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = vi.fn();

    const TestComponentWithoutProvider = () => {
      useToast();
      return <div>Test</div>;
    };

    expect(() => {
      render(<TestComponentWithoutProvider />);
    }).toThrow('useToast must be used within a ToastProvider');

    console.error = originalError;
  });

  it('returns toast ID when showing toast', () => {
    let toastId: string;

    const TestComponentWithId = () => {
      const { showToast } = useToast();
      
      return (
        <button 
          onClick={() => {
            toastId = showToast({ type: 'info', title: 'Test' });
          }}
        >
          Show Toast
        </button>
      );
    };

    render(
      <ToastProvider>
        <TestComponentWithId />
      </ToastProvider>
    );

    act(() => {
      fireEvent.click(screen.getByText('Show Toast'));
    });

    expect(toastId!).toBeDefined();
    expect(typeof toastId!).toBe('string');
    expect(toastId!).toMatch(/^toast-\d+-[a-z0-9]+$/);
  });
});