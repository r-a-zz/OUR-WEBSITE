import React from "react";
import { motion } from "framer-motion";

const LoadingSpinner = ({ size = "md", color = "blue" }) => {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  const colors = {
    blue: "border-blue-500",
    purple: "border-purple-500",
    white: "border-white",
    gray: "border-gray-500",
  };

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className={`${sizes[size]} border-2 border-transparent ${colors[color]} border-t-current rounded-full`}
    />
  );
};

export default LoadingSpinner;
