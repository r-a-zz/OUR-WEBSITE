/**
 * @fileoverview Advanced debugging and logging utilities for production-ready applications
 * @author SDE3 Frontend Engineer
 * @version 1.0.0
 */

import { LOG_LEVELS } from "../types";

/**
 * Enhanced logger with different levels and conditional logging
 */
class Logger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === "development";
    this.isDebugMode =
      localStorage.getItem("debug_mode") === "true" || this.isDevelopment;
  }

  /**
   * Log with specified level
   * @param {string} level - Log level
   * @param {string} component - Component name
   * @param {string} message - Log message
   * @param {Object} data - Additional data to log
   */
  log(level, component, message, data = {}) {
    if (!this.shouldLog(level)) return;

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${component}]`;

    const styles = this.getLogStyles(level);

    if (Object.keys(data).length > 0) {
      console.groupCollapsed(`%c${prefix} ${message}`, styles);
      console.table(data);
      console.groupEnd();
    } else {
      console.log(`%c${prefix} ${message}`, styles);
    }
  }

  /**
   * Determine if we should log based on level and environment
   * @param {string} level - Log level
   * @returns {boolean}
   */
  shouldLog(level) {
    if (level === LOG_LEVELS.ERROR) return true;
    if (level === LOG_LEVELS.WARN) return true;
    if (level === LOG_LEVELS.INFO && this.isDevelopment) return true;
    if (level === LOG_LEVELS.DEBUG && this.isDebugMode) return true;
    return false;
  }

  /**
   * Get styles for different log levels
   * @param {string} level - Log level
   * @returns {string} CSS styles
   */
  getLogStyles(level) {
    const styles = {
      [LOG_LEVELS.ERROR]: "color: #ff6b6b; font-weight: bold;",
      [LOG_LEVELS.WARN]: "color: #ffa726; font-weight: bold;",
      [LOG_LEVELS.INFO]: "color: #42a5f5; font-weight: normal;",
      [LOG_LEVELS.DEBUG]: "color: #66bb6a; font-weight: normal;",
    };
    return styles[level] || styles[LOG_LEVELS.INFO];
  }

  // Convenience methods
  error(component, message, data) {
    this.log(LOG_LEVELS.ERROR, component, message, data);
  }

  warn(component, message, data) {
    this.log(LOG_LEVELS.WARN, component, message, data);
  }

  info(component, message, data) {
    this.log(LOG_LEVELS.INFO, component, message, data);
  }

  debug(component, message, data) {
    this.log(LOG_LEVELS.DEBUG, component, message, data);
  }
}

// Singleton instance
export const logger = new Logger();

/**
 * Performance monitoring utility
 */
export class PerformanceMonitor {
  constructor() {
    this.timers = new Map();
  }

  /**
   * Start timing an operation
   * @param {string} name - Operation name
   */
  start(name) {
    this.timers.set(name, performance.now());
  }

  /**
   * End timing and log result
   * @param {string} name - Operation name
   * @param {string} component - Component name
   */
  end(name, component = "Performance") {
    const startTime = this.timers.get(name);
    if (!startTime) {
      logger.warn(component, `No start time found for: ${name}`);
      return;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(name);

    logger.debug(component, `${name} completed`, {
      duration: `${duration.toFixed(2)}ms`,
    });

    // Warn about slow operations
    if (duration > 100) {
      logger.warn(component, `Slow operation detected: ${name}`, {
        duration: `${duration.toFixed(2)}ms`,
      });
    }
  }
}

export const perfMonitor = new PerformanceMonitor();

/**
 * Error boundary utility for better error handling
 */
export const createErrorBoundary = (Component, fallback = null) => {
  return class ErrorBoundary extends Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
      return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
      logger.error("ErrorBoundary", "Component error caught", {
        error: error.message,
        stack: error.stack,
        errorInfo,
      });
    }

    render() {
      if (this.state.hasError) {
        return fallback || "Something went wrong.";
      }

      return Component;
    }
  };
};
