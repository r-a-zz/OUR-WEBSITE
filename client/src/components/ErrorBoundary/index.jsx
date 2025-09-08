/**
 * @fileoverview Enterprise-grade Error Boundary components
 * @author SDE3 Frontend Engineer
 * @version 1.0.0
 */

import React, { Component, memo } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { logger } from "../utils/debugUtils";

/**
 * Fallback UI component for error boundaries
 */
const ErrorFallback = memo(({ error, resetError, componentName }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="min-h-screen flex items-center justify-center bg-black p-4"
    >
      <div className="max-w-md w-full bg-red-900/20 border border-red-500/30 rounded-2xl p-8 text-center backdrop-blur-md">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-6"
        >
          <AlertTriangle size={32} className="text-red-400" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-white mb-4"
        >
          Oops! Something went wrong
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-red-200/80 mb-6 text-sm leading-relaxed"
        >
          {componentName
            ? `Error in ${componentName} component`
            : "An unexpected error occurred"}
          {process.env.NODE_ENV === "development" && error && (
            <details className="mt-4 text-xs text-red-300/60 text-left">
              <summary className="cursor-pointer">Technical Details</summary>
              <pre className="mt-2 p-2 bg-red-900/30 rounded overflow-auto">
                {error.message}
              </pre>
            </details>
          )}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <button
            onClick={resetError}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-200 transition-all duration-200 hover:scale-105"
          >
            <RefreshCw size={16} />
            Try Again
          </button>

          <button
            onClick={() => (window.location.href = "/")}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 rounded-lg text-cyan-200 transition-all duration-200 hover:scale-105"
          >
            <Home size={16} />
            Go Home
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
});

ErrorFallback.displayName = "ErrorFallback";

/**
 * Enhanced Error Boundary with comprehensive error handling
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, errorInfo) {
    const { componentName = "Unknown", onError } = this.props;

    // Log the error with comprehensive context
    logger.error("ErrorBoundary", `Error caught in ${componentName}`, {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      retryCount: this.state.retryCount,
      timestamp: new Date().toISOString(),
    });

    // Store error info in state
    this.setState({ errorInfo });

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }

    // Report to external error service in production
    if (process.env.NODE_ENV === "production") {
      this.reportErrorToService(error, errorInfo);
    }
  }

  reportErrorToService = (error, errorInfo) => {
    // This would integrate with services like Sentry, Bugsnag, etc.
    console.error("Error reported to service:", {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  };

  handleReset = () => {
    const maxRetries = 3;
    const newRetryCount = this.state.retryCount + 1;

    if (newRetryCount <= maxRetries) {
      logger.info(
        "ErrorBoundary",
        `Retry attempt ${newRetryCount}/${maxRetries}`
      );

      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: newRetryCount,
      });
    } else {
      logger.warn(
        "ErrorBoundary",
        "Max retry attempts reached, redirecting to home"
      );
      window.location.href = "/";
    }
  };

  render() {
    if (this.state.hasError) {
      const { fallback: CustomFallback, componentName } = this.props;

      if (CustomFallback) {
        return (
          <CustomFallback
            error={this.state.error}
            resetError={this.handleReset}
            componentName={componentName}
          />
        );
      }

      return (
        <ErrorFallback
          error={this.state.error}
          resetError={this.handleReset}
          componentName={componentName}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component to wrap components with error boundary
 */
export const withErrorBoundary = (WrappedComponent, options = {}) => {
  const ComponentWithErrorBoundary = (props) => (
    <ErrorBoundary
      componentName={
        options.componentName ||
        WrappedComponent.displayName ||
        WrappedComponent.name
      }
      fallback={options.fallback}
      onError={options.onError}
    >
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${
    WrappedComponent.displayName || WrappedComponent.name
  })`;

  return ComponentWithErrorBoundary;
};

export default ErrorBoundary;
