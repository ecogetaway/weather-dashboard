import React, { Component, ReactNode } from 'react';
import styles from './ErrorBoundary.module.css';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showToast?: boolean;
  level?: 'page' | 'component' | 'feature';
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorId?: string;
}

/**
 * Enhanced error boundary component for comprehensive error handling
 * Provides graceful fallbacks, error reporting, and user feedback
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const errorId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return { 
      hasError: true, 
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    this.setState({ errorInfo });
    
    // Report error to external service (if configured)
    this.reportError(error, errorInfo);
    
    // Call custom error handler
    this.props.onError?.(error, errorInfo);
  }

  private reportError = (error: Error, errorInfo: React.ErrorInfo) => {
    // In a real app, you would send this to an error reporting service
    // like Sentry, LogRocket, or Bugsnag
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errorId: this.state.errorId
    };

    // For now, just log to console
    console.group('🚨 Error Report');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Full Report:', errorReport);
    console.groupEnd();

    // In production, send to error reporting service:
    // errorReportingService.captureException(error, errorReport);
  };

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    } else {
      // Max retries reached, reload the page
      window.location.reload();
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private getErrorLevel = () => {
    return this.props.level || 'component';
  };

  private renderErrorFallback = () => {
    const { error, errorId } = this.state;
    const level = this.getErrorLevel();
    const canRetry = this.retryCount < this.maxRetries;

    if (level === 'page') {
      return (
        <div className={styles.pageError}>
          <div className={styles.errorContainer}>
            <div className={styles.errorIcon}>💥</div>
            <h1 className={styles.errorTitle}>Oops! Something went wrong</h1>
            <p className={styles.errorMessage}>
              We're sorry, but something unexpected happened. Our team has been notified.
            </p>
            <div className={styles.errorActions}>
              <button onClick={this.handleReload} className={styles.primaryButton}>
                Reload Page
              </button>
              <button 
                onClick={() => window.history.back()} 
                className={styles.secondaryButton}
              >
                Go Back
              </button>
            </div>
            {errorId && (
              <p className={styles.errorId}>
                Error ID: {errorId}
              </p>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className={styles.componentError}>
        <div className={styles.errorContent}>
          <div className={styles.errorIcon}>⚠️</div>
          <div className={styles.errorText}>
            <h3 className={styles.errorTitle}>
              {level === 'feature' ? 'Feature Unavailable' : 'Component Error'}
            </h3>
            <p className={styles.errorMessage}>
              {error?.message || 'Something went wrong loading this component.'}
            </p>
          </div>
          <div className={styles.errorActions}>
            {canRetry ? (
              <button onClick={this.handleRetry} className={styles.retryButton}>
                Try Again ({this.maxRetries - this.retryCount} left)
              </button>
            ) : (
              <button onClick={this.handleReload} className={styles.reloadButton}>
                Reload Page
              </button>
            )}
          </div>
        </div>
        {errorId && (
          <div className={styles.errorId}>
            Error ID: {errorId}
          </div>
        )}
      </div>
    );
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback || this.renderErrorFallback();
    }

    return this.props.children;
  }
}

export default ErrorBoundary;