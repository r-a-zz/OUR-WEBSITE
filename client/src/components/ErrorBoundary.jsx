import React from "react";
import { motion } from "framer-motion";
import { RefreshCw, Home, AlertTriangle } from "lucide-react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });

    // Log error to monitoring service in production
    if (process.env.NODE_ENV === "production") {
      console.error("Error caught by boundary:", error, errorInfo);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 max-w-md w-full text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-6"
            >
              <AlertTriangle size={32} className="text-red-400" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-white mb-4"
            >
              Oops! Something went wrong
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-white/70 mb-8 leading-relaxed"
            >
              We're sorry for the inconvenience. An unexpected error occurred
              while loading this page.
            </motion.p>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <motion.details
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-left mb-6 bg-black/20 rounded-lg p-4"
              >
                <summary className="text-white/90 font-medium cursor-pointer mb-2">
                  Error Details (Development)
                </summary>
                <pre className="text-red-300 text-xs overflow-auto max-h-32">
                  {this.state.error && this.state.error.toString()}
                  {this.state.errorInfo.componentStack}
                </pre>
              </motion.details>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={this.handleReload}
                className="flex-1 flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300"
              >
                <RefreshCw size={18} />
                <span>Reload Page</span>
              </motion.button>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={this.handleHome}
                className="flex-1 flex items-center justify-center space-x-2 py-3 border border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-all duration-300"
              >
                <Home size={18} />
                <span>Go Home</span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
