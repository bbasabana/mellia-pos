/**
 * Performance Monitoring Utilities
 * For tracking and optimizing app performance (<20ms target)
 */

type PerformanceMetric = {
  name: string;
  duration: number;
  timestamp: number;
};

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly P96_TARGET = 20; // ms

  /**
   * Measure execution time of a function
   */
  async measure<T>(name: string, fn: () => T | Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      
      this.recordMetric(name, duration);
      
      if (duration > this.P96_TARGET && process.env.NODE_ENV === 'development') {
        console.warn(`⚠️  Performance: ${name} took ${duration.toFixed(2)}ms (target: ${this.P96_TARGET}ms)`);
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(`${name}:error`, duration);
      throw error;
    }
  }

  /**
   * Record a metric
   */
  private recordMetric(name: string, duration: number) {
    this.metrics.push({
      name,
      duration,
      timestamp: Date.now(),
    });
    
    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics.shift();
    }
  }

  /**
   * Get P96 percentile for a specific metric
   */
  getP96(metricName: string): number | null {
    const filtered = this.metrics
      .filter(m => m.name === metricName)
      .map(m => m.duration)
      .sort((a, b) => a - b);
    
    if (filtered.length === 0) return null;
    
    const p96Index = Math.floor(filtered.length * 0.96);
    return filtered[p96Index];
  }

  /**
   * Get all metrics summary
   */
  getSummary() {
    const uniqueNames = new Set(this.metrics.map(m => m.name));
    const metricNames = Array.from(uniqueNames);
    
    return metricNames.map(name => {
      const values = this.metrics
        .filter(m => m.name === name)
        .map(m => m.duration);
      
      return {
        name,
        count: values.length,
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        p50: this.getPercentile(values, 0.5),
        p96: this.getPercentile(values, 0.96),
        p99: this.getPercentile(values, 0.99),
      };
    });
  }

  private getPercentile(values: number[], percentile: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.floor(sorted.length * percentile);
    return sorted[index] || 0;
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics = [];
  }
}

// Singleton instance
export const perfMonitor = new PerformanceMonitor();

/**
 * React hook for measuring component render time
 */
export function usePerfMonitor(componentName: string) {
  if (typeof window === 'undefined') return;
  
  const renderStart = performance.now();
  
  return () => {
    const renderTime = performance.now() - renderStart;
    if (renderTime > 16) { // More than one frame (60fps)
      console.warn(`⚠️  Slow render: ${componentName} took ${renderTime.toFixed(2)}ms`);
    }
  };
}

/**
 * Decorator for measuring function execution time
 */
export function measurePerformance(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  
  descriptor.value = async function (...args: any[]) {
    const start = performance.now();
    const result = await originalMethod.apply(this, args);
    const duration = performance.now() - start;
    
    if (duration > 20) {
      console.warn(`⚠️  ${propertyKey} took ${duration.toFixed(2)}ms`);
    }
    
    return result;
  };
  
  return descriptor;
}

export default perfMonitor;
