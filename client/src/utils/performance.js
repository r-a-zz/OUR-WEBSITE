import React from "react";

// Performance monitoring utilities

export const performanceMetrics = {
  // Measure component render time
  measureRender: (componentName, renderFn) => {
    if (process.env.NODE_ENV !== "development") return renderFn();

    const start = performance.now();
    const result = renderFn();
    const end = performance.now();

    console.log(`${componentName} render time: ${(end - start).toFixed(2)}ms`);
    return result;
  },

  // Measure Core Web Vitals
  measureWebVitals: () => {
    if (typeof window === "undefined") return;

    // Largest Contentful Paint
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log("LCP:", lastEntry.startTime);
    });
    observer.observe({ type: "largest-contentful-paint", buffered: true });

    // First Input Delay
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        console.log("FID:", entry.processingStart - entry.startTime);
      });
    });
    fidObserver.observe({ type: "first-input", buffered: true });

    // Cumulative Layout Shift
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          console.log("CLS:", clsValue);
        }
      }
    });
    clsObserver.observe({ type: "layout-shift", buffered: true });
  },

  // Memory usage monitoring
  measureMemory: () => {
    if (performance.memory) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1048576),
        total: Math.round(performance.memory.totalJSHeapSize / 1048576),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576),
      };
    }
    return null;
  },

  // Network information
  getNetworkInfo: () => {
    if (navigator.connection) {
      return {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt,
        saveData: navigator.connection.saveData,
      };
    }
    return null;
  },
};

// React performance utilities
export const withPerformanceTracking = (WrappedComponent, componentName) => {
  return React.memo((props) => {
    return performanceMetrics.measureRender(componentName, () => (
      <WrappedComponent {...props} />
    ));
  });
};

// Image loading optimization
export const optimizeImage = (src, options = {}) => {
  const { width = 800, height = 600, quality = 85, format = "webp" } = options;

  // If using a service like Cloudinary or ImageKit
  // return `${src}?w=${width}&h=${height}&q=${quality}&f=${format}`;

  return src; // Fallback to original
};

// Lazy loading utility
export const lazyLoad = (importFunc, fallback = null) => {
  const LazyComponent = React.lazy(importFunc);

  return (props) => (
    <React.Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </React.Suspense>
  );
};

// Bundle size analyzer
export const analyzeBundleSize = () => {
  if (process.env.NODE_ENV === "development") {
    console.log("Bundle analysis should be run in production build");
    return;
  }

  // This would typically integrate with webpack-bundle-analyzer
  console.log("Run: npx webpack-bundle-analyzer build/static/js/*.js");
};

export default performanceMetrics;
