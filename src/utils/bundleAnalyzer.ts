/**
 * Bundle analysis and optimization utilities
 * Helps identify and optimize bundle size and loading performance
 */

interface BundleMetrics {
  totalSize: number;
  gzippedSize: number;
  chunks: Array<{
    name: string;
    size: number;
    modules: string[];
  }>;
  duplicates: string[];
  unusedExports: string[];
}

interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
}

/**
 * Analyze bundle composition and identify optimization opportunities
 */
export class BundleAnalyzer {
  private metrics: BundleMetrics | null = null;

  /**
   * Analyze current bundle and return metrics
   */
  async analyzeBundleSize(): Promise<BundleMetrics> {
    // In a real implementation, this would integrate with webpack-bundle-analyzer
    // or similar tools to get actual bundle metrics
    
    const mockMetrics: BundleMetrics = {
      totalSize: 0,
      gzippedSize: 0,
      chunks: [],
      duplicates: [],
      unusedExports: []
    };

    // Simulate bundle analysis
    if (typeof window !== 'undefined') {
      // Get performance navigation timing
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        mockMetrics.totalSize = navigation.transferSize || 0;
        mockMetrics.gzippedSize = navigation.encodedBodySize || 0;
      }
    }

    this.metrics = mockMetrics;
    return mockMetrics;
  }

  /**
   * Get recommendations for bundle optimization
   */
  getOptimizationRecommendations(): string[] {
    if (!this.metrics) {
      return ['Run bundle analysis first'];
    }

    const recommendations: string[] = [];

    // Size-based recommendations
    if (this.metrics.totalSize > 1024 * 1024) { // > 1MB
      recommendations.push('Consider code splitting to reduce initial bundle size');
    }

    if (this.metrics.gzippedSize > 512 * 1024) { // > 512KB gzipped
      recommendations.push('Enable tree shaking to remove unused code');
    }

    // Duplicate detection
    if (this.metrics.duplicates.length > 0) {
      recommendations.push(`Remove duplicate dependencies: ${this.metrics.duplicates.join(', ')}`);
    }

    // Unused exports
    if (this.metrics.unusedExports.length > 0) {
      recommendations.push('Remove unused exports to reduce bundle size');
    }

    // General recommendations
    recommendations.push(
      'Use dynamic imports for non-critical components',
      'Implement service worker for caching',
      'Optimize images and use WebP format',
      'Minify and compress CSS and JavaScript'
    );

    return recommendations;
  }
}

/**
 * Performance monitoring and optimization utilities
 */
export class PerformanceOptimizer {
  private observer: PerformanceObserver | null = null;
  private metrics: Partial<PerformanceMetrics> = {};

  /**
   * Start monitoring Core Web Vitals
   */
  startMonitoring(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      console.warn('PerformanceObserver not supported');
      return;
    }

    // Monitor LCP
    this.observeMetric('largest-contentful-paint', (entries) => {
      const lastEntry = entries[entries.length - 1];
      this.metrics.lcp = lastEntry.startTime;
    });

    // Monitor FID
    this.observeMetric('first-input', (entries) => {
      entries.forEach((entry: any) => {
        this.metrics.fid = entry.processingStart - entry.startTime;
      });
    });

    // Monitor CLS
    let clsValue = 0;
    this.observeMetric('layout-shift', (entries) => {
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      this.metrics.cls = clsValue;
    });

    // Monitor navigation timing for TTFB and FCP
    this.observeNavigationTiming();
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  /**
   * Get performance score based on Core Web Vitals
   */
  getPerformanceScore(): {
    score: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    recommendations: string[];
  } {
    const recommendations: string[] = [];
    let score = 100;

    // LCP scoring (Good: <2.5s, Needs Improvement: 2.5-4s, Poor: >4s)
    if (this.metrics.lcp) {
      if (this.metrics.lcp > 4000) {
        score -= 30;
        recommendations.push('Optimize Largest Contentful Paint (LCP) - currently > 4s');
      } else if (this.metrics.lcp > 2500) {
        score -= 15;
        recommendations.push('Improve Largest Contentful Paint (LCP) - currently > 2.5s');
      }
    }

    // FID scoring (Good: <100ms, Needs Improvement: 100-300ms, Poor: >300ms)
    if (this.metrics.fid) {
      if (this.metrics.fid > 300) {
        score -= 25;
        recommendations.push('Optimize First Input Delay (FID) - currently > 300ms');
      } else if (this.metrics.fid > 100) {
        score -= 10;
        recommendations.push('Improve First Input Delay (FID) - currently > 100ms');
      }
    }

    // CLS scoring (Good: <0.1, Needs Improvement: 0.1-0.25, Poor: >0.25)
    if (this.metrics.cls) {
      if (this.metrics.cls > 0.25) {
        score -= 25;
        recommendations.push('Fix Cumulative Layout Shift (CLS) - currently > 0.25');
      } else if (this.metrics.cls > 0.1) {
        score -= 10;
        recommendations.push('Improve Cumulative Layout Shift (CLS) - currently > 0.1');
      }
    }

    // FCP scoring (Good: <1.8s, Needs Improvement: 1.8-3s, Poor: >3s)
    if (this.metrics.fcp) {
      if (this.metrics.fcp > 3000) {
        score -= 20;
        recommendations.push('Optimize First Contentful Paint (FCP) - currently > 3s');
      } else if (this.metrics.fcp > 1800) {
        score -= 10;
        recommendations.push('Improve First Contentful Paint (FCP) - currently > 1.8s');
      }
    }

    const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';

    return { score: Math.max(0, score), grade, recommendations };
  }

  private observeMetric(entryType: string, callback: (entries: PerformanceEntry[]) => void): void {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });
      observer.observe({ entryTypes: [entryType] });
    } catch (error) {
      console.warn(`Failed to observe ${entryType}:`, error);
    }
  }

  private observeNavigationTiming(): void {
    if (typeof window === 'undefined') return;

    // Use navigation timing API for TTFB and FCP
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        // Time to First Byte
        this.metrics.ttfb = navigation.responseStart - navigation.requestStart;
      }

      // First Contentful Paint
      const paintEntries = performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        this.metrics.fcp = fcpEntry.startTime;
      }
    });
  }
}

/**
 * Resource loading optimization utilities
 */
export class ResourceOptimizer {
  /**
   * Preload critical resources
   */
  preloadCriticalResources(): void {
    const criticalResources = [
      // Preload critical CSS
      { href: '/src/App.css', as: 'style' },
      // Preload critical fonts
      { href: '/fonts/inter-var.woff2', as: 'font', type: 'font/woff2', crossorigin: 'anonymous' },
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.href;
      link.as = resource.as;
      if (resource.type) link.type = resource.type;
      if (resource.crossorigin) link.crossOrigin = resource.crossorigin;
      
      document.head.appendChild(link);
    });
  }

  /**
   * Implement resource hints for better loading performance
   */
  addResourceHints(): void {
    const hints = [
      // DNS prefetch for external domains
      { rel: 'dns-prefetch', href: '//api.openweathermap.org' },
      { rel: 'dns-prefetch', href: '//fonts.googleapis.com' },
      
      // Preconnect to critical origins
      { rel: 'preconnect', href: 'https://api.openweathermap.org' },
    ];

    hints.forEach(hint => {
      const link = document.createElement('link');
      link.rel = hint.rel;
      link.href = hint.href;
      document.head.appendChild(link);
    });
  }

  /**
   * Optimize image loading with lazy loading and WebP support
   */
  optimizeImageLoading(): void {
    // Add intersection observer for lazy loading images
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              imageObserver.unobserve(img);
            }
          }
        });
      });

      // Observe all images with data-src attribute
      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }

  /**
   * Implement service worker for caching
   */
  registerServiceWorker(): void {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => {
            console.log('SW registered: ', registration);
          })
          .catch(registrationError => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }
  }
}

// Create singleton instances
export const bundleAnalyzer = new BundleAnalyzer();
export const performanceOptimizer = new PerformanceOptimizer();
export const resourceOptimizer = new ResourceOptimizer();

// Auto-start performance monitoring in browser environment
if (typeof window !== 'undefined') {
  performanceOptimizer.startMonitoring();
  resourceOptimizer.addResourceHints();
}