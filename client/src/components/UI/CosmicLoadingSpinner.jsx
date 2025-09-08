import React, { memo } from "react";
import { motion } from "framer-motion";

const CosmicLoadingSpinner = memo(({ size = 40, className = "" }) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="relative">
        {/* Single rotating ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="rounded-full border-2 border-transparent"
          style={{
            width: size,
            height: size,
            borderTopColor: "#22d3ee",
            borderRightColor: "#a855f7",
            willChange: "transform",
          }}
        />

        {/* Simple pulsing core */}
        <motion.div
          animate={{
            opacity: [0.4, 1, 0.4],
          }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-3 bg-gradient-to-br from-cyan-300 to-purple-300 rounded-full"
          style={{
            filter: "blur(1px)",
            willChange: "opacity",
          }}
        />
      </div>
    </div>
  );
});

CosmicLoadingSpinner.displayName = "CosmicLoadingSpinner";

export default CosmicLoadingSpinner;
