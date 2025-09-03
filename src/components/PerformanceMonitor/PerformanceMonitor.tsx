import React, { useEffect, useState } from 'react';
import { performanceOptimizer, bundleAnalyzer } from '@/utils/bundleAnalyzer';
import styles from './PerformanceMonitor.module.css';

interface PerformanceData {
  fcp?: number;
  lcp?: number;
  fid?: number;
  cls?: number;
  ttfb?: number;
  score: number;
  grade: string;
  recommendations: string[];
}

export interface PerformanceMonitorProps {
  enabled?: boolean;
  showInProduction?: boolean;
  onMetricsUpdate?: (metrics: PerformanceData) => void;
}

/**
 * PerformanceMonitor component for tracking and displaying Core Web Vitals
 * Only shows in development mode unless explicitly enabled for production
 */
const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  enabled = process.env.NODE_ENV === 'development',
  showInProduction = false,
  onMetricsUpdate
}) => {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [bundleSize, setBundleSize] = useState<number>(0);

  useEffect(() => {
    if (!enabled && !(showInProduction && process.env.NODE_ENV === 'production')) {
      return;
    }

    // Start performance monitoring
    performanceOptimizer.startMonitoring();

    // Update metrics periodically
    const updateMetrics = () => {
      const metrics = performanceOptimizer.getMetrics();
      const scoreData = performanceOptimizer.getPerformanceScore();
      
      const data: PerformanceData = {
        ...metrics,
        score: scoreData.score,
        grade: scoreData.grade,
        recommendations: scoreData.recommendations
      };

      setPerformanceData(data);
      onMetricsUpdate?.(data);
    };

    // Initial update after a delay to allow page to load
    const initialTimer = setTimeout(updateMetrics, 2000);
    
    // Periodic updates
    const interval = setInterval(updateMetrics, 5000);

    // Analyze bundle size
    bundleAnalyzer.analyzeBundleSize().then(metrics => {
      setBundleSize(metrics.totalSize);
    });

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
      performanceOptimizer.stopMonitoring();
    };
  }, [enabled, showInProduction, onMetricsUpdate]);

  if (!enabled && !(showInProduction && process.env.NODE_ENV === 'production')) {
    return null;
  }

  if (!performanceData) {
    return null;
  }

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return '#22c55e';
      case 'B': return '#84cc16';
      case 'C': return '#eab308';
      case 'D': return '#f97316';
      case 'F': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const formatMetric = (value: number | undefined, unit: string) => {
    if (value === undefined) return 'N/A';
    return `${Math.round(value)}${unit}`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <div className={styles.performanceMonitor}>
      <button
        className={styles.toggleButton}
        onClick={() => setIsVisible(!isVisible)}
        aria-label="Toggle performance monitor"
        style={{ backgroundColor: getGradeColor(performanceData.grade) }}
      >
        {performanceData.grade}
      </button>

      {isVisible && (
        <div className={styles.panel}>
          <div className={styles.header}>
            <h3 className={styles.title}>Performance Monitor</h3>
            <button
              className={styles.closeButton}
              onClick={() => setIsVisible(false)}
              aria-label="Close performance monitor"
            >
              ×
            </button>
          </div>

          <div className={styles.content}>
            <div className={styles.scoreSection}>
              <div className={styles.score}>
                <span 
                  className={styles.scoreValue}
                  style={{ color: getGradeColor(performanceData.grade) }}
                >
                  {performanceData.score}
                </span>
                <span className={styles.scoreGrade}>
                  Grade: {performanceData.grade}
                </span>
              </div>
            </div>

            <div className={styles.metricsGrid}>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>FCP</span>
                <span className={styles.metricValue}>
                  {formatMetric(performanceData.fcp, 'ms')}
                </span>
              </div>

              <div className={styles.metric}>
                <span className={styles.metricLabel}>LCP</span>
                <span className={styles.metricValue}>
                  {formatMetric(performanceData.lcp, 'ms')}
                </span>
              </div>

              <div className={styles.metric}>
                <span className={styles.metricLabel}>FID</span>
                <span className={styles.metricValue}>
                  {formatMetric(performanceData.fid, 'ms')}
                </span>
              </div>

              <div className={styles.metric}>
                <span className={styles.metricLabel}>CLS</span>
                <span className={styles.metricValue}>
                  {performanceData.cls?.toFixed(3) || 'N/A'}
                </span>
              </div>

              <div className={styles.metric}>
                <span className={styles.metricLabel}>TTFB</span>
                <span className={styles.metricValue}>
                  {formatMetric(performanceData.ttfb, 'ms')}
                </span>
              </div>

              <div className={styles.metric}>
                <span className={styles.metricLabel}>Bundle</span>
                <span className={styles.metricValue}>
                  {formatBytes(bundleSize)}
                </span>
              </div>
            </div>

            {performanceData.recommendations.length > 0 && (
              <div className={styles.recommendations}>
                <h4 className={styles.recommendationsTitle}>Recommendations</h4>
                <ul className={styles.recommendationsList}>
                  {performanceData.recommendations.slice(0, 3).map((rec, index) => (
                    <li key={index} className={styles.recommendation}>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitor;