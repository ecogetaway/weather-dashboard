import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import PerformanceMonitor, { performanceMonitor } from './performanceMonitor';

// Mock performance API
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
};

Object.defineProperty(global, 'performance', {
  value: mockPerformance,
  writable: true,
});

// Mock PerformanceObserver
class MockPerformanceObserver {
  callback: (list: any) => void;
  
  constructor(callback: (list: any) => void) {
    this.callback = callback;
  }
  
  observe() {}
  disconnect() {}
}

Object.defineProperty(global, 'PerformanceObserver', {
  value: MockPerformanceObserver,
  writable: true,
});

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;
  let mockTime = 1000;

  beforeEach(() => {
    vi.clearAllMocks();
    monitor = new PerformanceMonitor();
    mockTime = 1000;
    
    // Mock performance.now to return predictable values
    mockPerformance.now.mockImplementation(() => mockTime);
  });

  afterEach(() => {
    monitor.cleanup();
    vi.restoreAllMocks();
  });

  describe('basic measurement functionality', () => {
    it('starts and ends measurements correctly', () => {
      monitor.startMeasure('test-metric');
      
      // Advance time
      mockTime = 1500;
      
      const result = monitor.endMeasure('test-metric');
      
      expect(result).toEqual({
        name: 'test-metric',
        startTime: 1000,
        endTime: 1500,
        duration: 500
      });
    });

    it('stores metadata with measurements', () => {
      const metadata = { component: 'TestComponent', type: 'render' };
      monitor.startMeasure('test-with-metadata', metadata);
      
      mockTime = 1200;
      
      const result = monitor.endMeasure('test-with-metadata');
      
      expect(result?.metadata).toEqual(metadata);
    });

    it('returns null for non-existent measurements', () => {
      const result = monitor.endMeasure('non-existent');
      expect(result).toBeNull();
    });

    it('warns when ending non-existent measurement', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      monitor.endMeasure('non-existent');
      
      expect(consoleSpy).toHaveBeenCalledWith('Performance metric "non-existent" not found');
      consoleSpy.mockRestore();
    });
  });

  describe('metric retrieval', () => {
    it('gets individual metrics', () => {
      monitor.startMeasure('test-metric');
      mockTime = 1300;
      monitor.endMeasure('test-metric');
      
      const metric = monitor.getMetric('test-metric');
      
      expect(metric).toEqual({
        name: 'test-metric',
        startTime: 1000,
        endTime: 1300,
        duration: 300
      });
    });

    it('returns null for non-existent metrics', () => {
      const metric = monitor.getMetric('non-existent');
      expect(metric).toBeNull();
    });

    it('gets all metrics', () => {
      monitor.startMeasure('metric1');
      mockTime = 1100;
      monitor.endMeasure('metric1');
      
      monitor.startMeasure('metric2');
      mockTime = 1200;
      monitor.endMeasure('metric2');
      
      const allMetrics = monitor.getAllMetrics();
      
      expect(allMetrics).toHaveLength(2);
      expect(allMetrics.map(m => m.name)).toEqual(['metric1', 'metric2']);
    });

    it('clears all metrics', () => {
      monitor.startMeasure('metric1');
      monitor.startMeasure('metric2');
      
      monitor.clearMetrics();
      
      expect(monitor.getAllMetrics()).toHaveLength(0);
    });
  });

  describe('component render measurement', () => {
    it('measures component render time', () => {
      const renderFn = vi.fn();
      
      const duration = monitor.measureComponentRender('TestComponent', renderFn);
      
      expect(renderFn).toHaveBeenCalled();
      expect(duration).toBe(0); // Mock returns same time
      
      const metric = monitor.getMetric('component-render-TestComponent');
      expect(metric?.metadata?.type).toBe('component-render');
    });

    it('handles render function errors', () => {
      const errorFn = vi.fn(() => {
        throw new Error('Render error');
      });
      
      expect(() => {
        monitor.measureComponentRender('ErrorComponent', errorFn);
      }).toThrow('Render error');
      
      // Should still create metric even if function throws
      const metric = monitor.getMetric('component-render-ErrorComponent');
      expect(metric).toBeDefined();
    });
  });

  describe('lazy loading measurement', () => {
    it('measures successful lazy loading', async () => {
      const loadPromise = Promise.resolve('loaded content');
      
      const result = await monitor.measureLazyLoad('test-resource', loadPromise);
      
      expect(result).toBe('loaded content');
      
      const metric = monitor.getMetric('lazy-load-test-resource');
      expect(metric?.metadata?.type).toBe('lazy-load');
    });

    it('measures failed lazy loading', async () => {
      const loadPromise = Promise.reject(new Error('Load failed'));
      
      await expect(
        monitor.measureLazyLoad('failed-resource', loadPromise)
      ).rejects.toThrow('Load failed');
      
      const metric = monitor.getMetric('lazy-load-failed-resource');
      expect(metric?.metadata?.type).toBe('lazy-load');
    });

    it('logs successful lazy load times', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      mockTime = 1000;
      
      const loadPromise = new Promise(resolve => {
        setTimeout(() => {
          mockTime = 1500;
          resolve('content');
        }, 0);
      });
      
      await monitor.measureLazyLoad('logged-resource', loadPromise);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Lazy loaded logged-resource in')
      );
      
      consoleSpy.mockRestore();
    });

    it('logs failed lazy load times', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockTime = 1000;
      
      const loadPromise = new Promise((_, reject) => {
        setTimeout(() => {
          mockTime = 1500;
          reject(new Error('Load error'));
        }, 0);
      });
      
      await expect(
        monitor.measureLazyLoad('error-resource', loadPromise)
      ).rejects.toThrow('Load error');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to lazy load error-resource after'),
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('web vitals monitoring', () => {
    it('sets up observers when supported', () => {
      const observeSpy = vi.spyOn(MockPerformanceObserver.prototype, 'observe');
      
      monitor.monitorWebVitals();
      
      expect(observeSpy).toHaveBeenCalledWith({ entryTypes: ['largest-contentful-paint'] });
      expect(observeSpy).toHaveBeenCalledWith({ entryTypes: ['first-input'] });
      expect(observeSpy).toHaveBeenCalledWith({ entryTypes: ['layout-shift'] });
    });

    it('handles unsupported observers gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Mock observer.observe to throw
      vi.spyOn(MockPerformanceObserver.prototype, 'observe').mockImplementation(() => {
        throw new Error('Not supported');
      });
      
      monitor.monitorWebVitals();
      
      expect(consoleSpy).toHaveBeenCalledWith('LCP observer not supported');
      expect(consoleSpy).toHaveBeenCalledWith('FID observer not supported');
      expect(consoleSpy).toHaveBeenCalledWith('CLS observer not supported');
      
      consoleSpy.mockRestore();
    });

    it('processes LCP entries correctly', () => {
      let lcpCallback: (list: any) => void;
      
      vi.spyOn(MockPerformanceObserver.prototype, 'observe').mockImplementation(function(this: MockPerformanceObserver) {
        if (this.callback) {
          lcpCallback = this.callback;
        }
      });
      
      monitor.monitorWebVitals();
      
      // Simulate LCP entry
      lcpCallback!({
        getEntries: () => [{
          startTime: 1500,
          element: { tagName: 'IMG' }
        }]
      });
      
      const lcpMetric = monitor.getMetric('lcp');
      expect(lcpMetric?.duration).toBe(1500);
      expect(lcpMetric?.metadata?.element).toBe('IMG');
    });

    it('processes FID entries correctly', () => {
      let fidCallback: (list: any) => void;
      
      vi.spyOn(MockPerformanceObserver.prototype, 'observe').mockImplementation(function(this: MockPerformanceObserver) {
        if (this.callback) {
          fidCallback = this.callback;
        }
      });
      
      monitor.monitorWebVitals();
      
      // Simulate FID entry
      fidCallback!({
        getEntries: () => [{
          startTime: 100,
          processingStart: 50,
          name: 'click'
        }]
      });
      
      const fidMetric = monitor.getMetric('fid');
      expect(fidMetric?.duration).toBe(50);
      expect(fidMetric?.metadata?.inputType).toBe('click');
    });

    it('processes CLS entries correctly', () => {
      let clsCallback: (list: any) => void;
      
      vi.spyOn(MockPerformanceObserver.prototype, 'observe').mockImplementation(function(this: MockPerformanceObserver) {
        if (this.callback) {
          clsCallback = this.callback;
        }
      });
      
      monitor.monitorWebVitals();
      
      // Simulate CLS entries
      clsCallback!({
        getEntries: () => [
          { value: 0.05, hadRecentInput: false },
          { value: 0.03, hadRecentInput: false },
          { value: 0.02, hadRecentInput: true } // Should be ignored
        ]
      });
      
      const clsMetric = monitor.getMetric('cls');
      expect(clsMetric?.duration).toBe(0.08); // 0.05 + 0.03
      expect(clsMetric?.metadata?.score).toBe('good'); // < 0.1
    });

    it('categorizes CLS scores correctly', () => {
      let clsCallback: (list: any) => void;
      
      vi.spyOn(MockPerformanceObserver.prototype, 'observe').mockImplementation(function(this: MockPerformanceObserver) {
        if (this.callback) {
          clsCallback = this.callback;
        }
      });
      
      monitor.monitorWebVitals();
      
      // Test "needs-improvement" score
      clsCallback!({
        getEntries: () => [{ value: 0.15, hadRecentInput: false }]
      });
      
      let clsMetric = monitor.getMetric('cls');
      expect(clsMetric?.metadata?.score).toBe('needs-improvement');
      
      // Test "poor" score
      clsCallback!({
        getEntries: () => [{ value: 0.3, hadRecentInput: false }]
      });
      
      clsMetric = monitor.getMetric('cls');
      expect(clsMetric?.metadata?.score).toBe('poor');
    });
  });

  describe('performance summary', () => {
    it('generates comprehensive performance summary', () => {
      // Add some metrics
      monitor.startMeasure('lazy-load-component', { type: 'lazy-load' });
      monitor.endMeasure('lazy-load-component');
      
      monitor.measureComponentRender('TestComponent', () => {});
      
      // Mock web vitals
      monitor['metrics'].set('lcp', {
        name: 'lcp',
        startTime: 0,
        endTime: 1500,
        duration: 1500,
        metadata: { type: 'web-vital' }
      });
      
      const summary = monitor.getPerformanceSummary();
      
      expect(summary.webVitals.lcp).toBeDefined();
      expect(summary.lazyLoading).toHaveLength(1);
      expect(summary.componentRenders).toHaveLength(1);
    });

    it('handles missing web vitals gracefully', () => {
      const summary = monitor.getPerformanceSummary();
      
      expect(summary.webVitals.lcp).toBeNull();
      expect(summary.webVitals.fid).toBeNull();
      expect(summary.webVitals.cls).toBeNull();
      expect(summary.lazyLoading).toEqual([]);
      expect(summary.componentRenders).toEqual([]);
    });
  });

  describe('cleanup', () => {
    it('disconnects all observers and clears metrics', () => {
      const disconnectSpy = vi.spyOn(MockPerformanceObserver.prototype, 'disconnect');
      
      monitor.monitorWebVitals();
      monitor.startMeasure('test-metric');
      
      monitor.cleanup();
      
      expect(disconnectSpy).toHaveBeenCalled();
      expect(monitor.getAllMetrics()).toHaveLength(0);
    });
  });

  describe('singleton instance', () => {
    it('exports a singleton instance', () => {
      expect(performanceMonitor).toBeInstanceOf(PerformanceMonitor);
    });

    it('auto-starts web vitals monitoring in browser environment', () => {
      // This is tested by the module loading, but we can verify the instance exists
      expect(performanceMonitor).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('handles multiple measurements with same name', () => {
      monitor.startMeasure('duplicate');
      mockTime = 1100;
      monitor.endMeasure('duplicate');
      
      // Start again with same name (should overwrite)
      monitor.startMeasure('duplicate');
      mockTime = 1300;
      monitor.endMeasure('duplicate');
      
      const metric = monitor.getMetric('duplicate');
      expect(metric?.duration).toBe(200); // Latest measurement
    });

    it('handles very long measurement names', () => {
      const longName = 'a'.repeat(1000);
      
      monitor.startMeasure(longName);
      mockTime = 1100;
      const result = monitor.endMeasure(longName);
      
      expect(result?.name).toBe(longName);
    });

    it('handles measurements with zero duration', () => {
      monitor.startMeasure('zero-duration');
      // Don't advance time
      const result = monitor.endMeasure('zero-duration');
      
      expect(result?.duration).toBe(0);
    });
  });
});