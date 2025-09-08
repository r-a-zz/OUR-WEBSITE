/**
 * @fileoverview Advanced Performance Monitoring and Optimization Utilities
 * @author SDE3 Frontend Engineer
 * @version 1.0.0
 */

import { logger } from "./debugUtils";

/**
 * Performance metrics collector and analyzer
 */
class PerformanceAnalyzer {
  constructor() {
    this.metrics = new Map();
    this.observers = [];
    this.isEnabled =
      process.env.NODE_ENV === "development" ||
      localStorage.getItem("perf_monitor") === "true";

    if (this.isEnabled) {
      this.initializeObservers();
    }
  }

  /**
   * Initialize performance observers
   */
  initializeObservers() {
    try {
      // Observe navigation timing
      if ("PerformanceObserver" in window) {
        const navigationObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordNavigationMetrics(entry);
          }
        });
        navigationObserver.observe({ entryTypes: ["navigation"] });
        this.observers.push(navigationObserver);

        // Observe resource timing
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordResourceMetrics(entry);
          }
        });
        resourceObserver.observe({ entryTypes: ["resource"] });
        this.observers.push(resourceObserver);

        // Observe layout shifts (CLS)
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordLayoutShift(entry);
          }
        });
        clsObserver.observe({ entryTypes: ["layout-shift"] });
        this.observers.push(clsObserver);

        // Observe paint timing
        const paintObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordPaintMetric(entry);
          }
        });
        paintObserver.observe({ entryTypes: ["paint"] });
        this.observers.push(paintObserver);
      }
    } catch (error) {
      logger.error("PerformanceAnalyzer", "Error initializing observers", {
        error: error.message,
      });
    }
  }

  /**
   * Record navigation metrics
   */
  recordNavigationMetrics(entry) {
    const metrics = {
      domContentLoaded:
        entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
      loadComplete: entry.loadEventEnd - entry.loadEventStart,
      domInteractive: entry.domInteractive - entry.fetchStart,
      totalPageLoad: entry.loadEventEnd - entry.fetchStart,
    };

    this.metrics.set("navigation", metrics);

    logger.info("PerformanceAnalyzer", "Navigation metrics recorded", metrics);
  }

  /**
   * Record resource loading metrics
   */
  recordResourceMetrics(entry) {
    const resourceMetrics = this.metrics.get("resources") || [];

    const metric = {
      name: entry.name,
      type: this.getResourceType(entry.name),
      duration: entry.responseEnd - entry.startTime,
      size: entry.transferSize || 0,
      timestamp: Date.now(),
    };

    resourceMetrics.push(metric);
    this.metrics.set("resources", resourceMetrics);

    // Warn about slow resources
    if (metric.duration > 1000) {
      logger.warn("PerformanceAnalyzer", "Slow resource detected", metric);
    }
  }

  /**
   * Record layout shift metrics (CLS)
   */
  recordLayoutShift(entry) {
    const shifts = this.metrics.get("layoutShifts") || [];
    shifts.push({
      value: entry.value,
      timestamp: entry.startTime,
    });
    this.metrics.set("layoutShifts", shifts);

    // Calculate cumulative layout shift
    const totalCLS = shifts.reduce((sum, shift) => sum + shift.value, 0);

    if (totalCLS > 0.1) {
      logger.warn(
        "PerformanceAnalyzer",
        "High cumulative layout shift detected",
        {
          totalCLS,
          latestShift: entry.value,
        }
      );
    }
  }

  /**
   * Record paint metrics
   */
  recordPaintMetric(entry) {
    const paintMetrics = this.metrics.get("paint") || {};
    paintMetrics[entry.name] = entry.startTime;
    this.metrics.set("paint", paintMetrics);

    logger.debug("PerformanceAnalyzer", `${entry.name} recorded`, {
      time: entry.startTime,
    });
  }

  /**
   * Get resource type from URL
   */
  getResourceType(url) {
    if (url.match(/\.(js|jsx|ts|tsx)$/)) return "script";
    if (url.match(/\.(css|scss|sass)$/)) return "stylesheet";
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return "image";
    if (url.match(/\.(woff|woff2|ttf|eot)$/)) return "font";
    return "other";
  }

  /**
   * Generate comprehensive performance report
   */
  generateReport() {
    if (!this.isEnabled) return null;

    const report = {
      timestamp: new Date().toISOString(),
      navigation: this.metrics.get("navigation"),
      paint: this.metrics.get("paint"),
      resources: this.analyzeResources(),
      layoutShifts: this.analyzeLayoutShifts(),
      recommendations: this.generateRecommendations(),
    };

    logger.info("PerformanceAnalyzer", "Performance report generated", report);
    return report;
  }

  /**
   * Analyze resource loading patterns
   */
  analyzeResources() {
    const resources = this.metrics.get("resources") || [];

    const analysis = {
      total: resources.length,
      byType: {},
      slowest: [],
      totalSize: 0,
      averageLoadTime: 0,
    };

    resources.forEach((resource) => {
      // Group by type
      if (!analysis.byType[resource.type]) {
        analysis.byType[resource.type] = {
          count: 0,
          totalSize: 0,
          totalTime: 0,
        };
      }
      analysis.byType[resource.type].count++;
      analysis.byType[resource.type].totalSize += resource.size;
      analysis.byType[resource.type].totalTime += resource.duration;

      analysis.totalSize += resource.size;
    });

    // Calculate averages
    if (resources.length > 0) {
      analysis.averageLoadTime =
        resources.reduce((sum, r) => sum + r.duration, 0) / resources.length;
    }

    // Find slowest resources
    analysis.slowest = resources
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5);

    return analysis;
  }

  /**
   * Analyze layout shifts
   */
  analyzeLayoutShifts() {
    const shifts = this.metrics.get("layoutShifts") || [];

    return {
      total: shifts.length,
      cumulativeScore: shifts.reduce((sum, shift) => sum + shift.value, 0),
      maxShift: Math.max(...shifts.map((s) => s.value), 0),
      timeline: shifts,
    };
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    const navigation = this.metrics.get("navigation");
    const resources = this.analyzeResources();
    const shifts = this.analyzeLayoutShifts();

    // Navigation recommendations
    if (navigation?.totalPageLoad > 3000) {
      recommendations.push({
        type: "critical",
        category: "loading",
        message: "Page load time exceeds 3 seconds",
        suggestion: "Consider code splitting and lazy loading",
      });
    }

    // Resource recommendations
    if (resources.totalSize > 1024 * 1024) {
      // 1MB
      recommendations.push({
        type: "warning",
        category: "resources",
        message: "Total resource size exceeds 1MB",
        suggestion: "Optimize images and compress assets",
      });
    }

    // Layout shift recommendations
    if (shifts.cumulativeScore > 0.1) {
      recommendations.push({
        type: "warning",
        category: "layout",
        message: "High cumulative layout shift detected",
        suggestion: "Add explicit dimensions to images and dynamic content",
      });
    }

    return recommendations;
  }

  /**
   * Clean up observers
   */
  cleanup() {
    this.observers.forEach((observer) => {
      try {
        observer.disconnect();
      } catch (error) {
        logger.error("PerformanceAnalyzer", "Error cleaning up observer", {
          error: error.message,
        });
      }
    });
    this.observers = [];
  }
}

// Singleton instance
export const performanceAnalyzer = new PerformanceAnalyzer();

/**
 * React component performance monitor HOC
 */
export const withPerformanceMonitoring = (WrappedComponent, componentName) => {
  // This would be implemented with React.memo and useEffect
  // For now, return the component as-is to avoid JSX issues in .js files
  return WrappedComponent;
};

/**
 * Bundle analyzer utility
 */
export const bundleAnalyzer = {
  analyzeChunkLoading() {
    const chunks = performance
      .getEntriesByType("resource")
      .filter((entry) => entry.name.includes("chunk"))
      .map((entry) => ({
        name: entry.name,
        size: entry.transferSize,
        loadTime: entry.responseEnd - entry.startTime,
      }));

    logger.info("BundleAnalyzer", "Chunk loading analysis", {
      totalChunks: chunks.length,
      chunks,
    });

    return chunks;
  },

  detectUnusedCode() {
    // This would integrate with tools like webpack-bundle-analyzer
    logger.info(
      "BundleAnalyzer",
      "Unused code detection would require build-time analysis"
    );
  },
};

// Export for use in development tools
if (process.env.NODE_ENV === "development") {
  window.__PERFORMANCE_ANALYZER__ = performanceAnalyzer;
  window.__BUNDLE_ANALYZER__ = bundleAnalyzer;
}
