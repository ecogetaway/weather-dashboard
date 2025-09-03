/**
 * Performance monitoring utilities for tracking lazy loading and component performance
 */

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private observers: Map<string, PerformanceObserver> = new Map();

  /**
   * Start measuring a performance metric
   */
  startMeasure(name: string, metadata?: Record<string, any>): void {
    const startTime = performance.now();
    this.metrics.set(name, {
      name,
      startTime,
      metadata
    });
  }

  /**
   * End measuring a performance metric
   */
  endMeasure(name: string): PerformanceMetric | null {
    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`Performance metric "${name}" not found`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    const completedMetric: PerformanceMetric = {
      ...metric,
      endTime,
      duration
    };

    this.metrics.set(name, completedMetric);
    return completedMetric;
  }

  /**
   * Get a performance metric
   */
  getMetric(name: string): PerformanceMetric | null {
    return this.metrics.get(name) || null;
  }

  /**
   * Get all performance metrics
   */
  getAllMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
  }

  /**
   * Measure component render time
   */
  measureComponentRender(componentName: string, renderFn: () => void): number {
    const startTime = performance.now();
    renderFn();
    const endTime = performance.now();
    const duration = endTime - startTime;

    this.metrics.set(`component-render-${componentName}`, {
      name: `component-render-${componentName}`,
      startTime,
      endTime,
      duration,
      metadata: { type: 'component-render' }
    });

    return duration;
  }

  /**
   * Measure lazy loading performance
   */
  measureLazyLoad(resourceName: string, loadPromise: Promise<any>): Promise<any> {
    this.startMeasure(`lazy-load-${resourceName}`, { type: 'lazy-load' });

    return loadPromise
      .then((result) => {
        const metric = this.endMeasure(`lazy-load-${resourceName}`);
        if (metric && metric.duration) {
          console.log(`Lazy loaded ${resourceName} in ${metric.duration.toFixed(2)}ms`);
        }
        return result;
      })
      .catch((error) => {
        const metric = this.endMeasure(`lazy-load-${resourceName}`);
        if (metric && metric.duration) {
          console.error(`Failed to lazy load ${resourceName} after ${metric.duration.toFixed(2)}ms:`, error);
        }
        throw error;
      });
  }

  /**
   * Monitor Core Web Vitals
   */
  monitorWebVitals(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    // Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as any;
      
      this.metrics.set('lcp', {
        name: 'lcp',
        startTime: 0,
        endTime: lastEntry.startTime,
        duration: lastEntry.startTime,
        metadata: { 
          type: 'web-vital',
          element: lastEntry.element?.tagName || 'unknown'
        }
      });
    });

    try {
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.set('lcp', lcpObserver);
    } catch (e) {
      console.warn('LCP observer not supported');
    }

    // First Input Delay (FID)
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        this.metrics.set('fid', {
          name: 'fid',
          startTime: entry.startTime,
          endTime: entry.startTime + entry.processingStart,
          duration: entry.processingStart,
          metadata: { 
            type: 'web-vital',
            inputType: entry.name
          }
        });
      });
    });

    try {
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.set('fid', fidObserver);
    } catch (e) {
      console.warn('FID observer not supported');
    }

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });

      this.metrics.set('cls', {
        name: 'cls',
        startTime: 0,
        endTime: performance.now(),
        duration: clsValue,
        metadata: { 
          type: 'web-vital',
          score: clsValue < 0.1 ? 'good' : clsValue < 0.25 ? 'needs-improvement' : 'poor'
        }
      });
    });

    try {
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.set('cls', clsObserver);
    } catch (e) {
      console.warn('CLS observer not supported');
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    webVitals: Record<string, any>;
    lazyLoading: PerformanceMetric[];
    componentRenders: PerformanceMetric[];
  } {
    const allMetrics = this.getAllMetrics();
    
    const webVitals = {
      lcp: this.getMetric('lcp'),
      fid: this.getMetric('fid'),
      cls: this.getMetric('cls')
    };

    const lazyLoading = allMetrics.filter(m => 
      m.metadata?.type === 'lazy-load'
    );

    const componentRenders = allMetrics.filter(m => 
      m.metadata?.type === 'component-render'
    );

    return {
      webVitals,
      lazyLoading,
      componentRenders
    };
  }

  /**
   * Cleanup observers
   */
  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.clearMetrics();
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Auto-start web vitals monitoring in browser environment
if (typeof window !== 'undefined') {
  performanceMonitor.monitorWebVitals();
}

export default PerformanceMonitor;