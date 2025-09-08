import React from "react";
import { motion } from "framer-motion";

const Toast = ({
  message,
  type = "info",
  isVisible,
  onClose,
  duration = 3000,
}) => {
  React.useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  const variants = {
    hidden: { opacity: 0, y: 50, scale: 0.3 },
    visible: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, scale: 0.5, transition: { duration: 0.2 } },
  };

  const typeStyles = {
    success: "bg-green-500/20 border-green-500/30 text-green-300",
    error: "bg-red-500/20 border-red-500/30 text-red-300",
    warning: "bg-yellow-500/20 border-yellow-500/30 text-yellow-300",
    info: "bg-blue-500/20 border-blue-500/30 text-blue-300",
  };

  if (!isVisible) return null;

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={`fixed top-4 right-4 p-4 rounded-xl border backdrop-blur-md z-50 ${typeStyles[type]} max-w-sm`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{message}</p>
        <button
          onClick={onClose}
          className="ml-4 text-current hover:opacity-70 transition-opacity"
        >
          ×
        </button>
      </div>
    </motion.div>
  );
};

export default Toast;
