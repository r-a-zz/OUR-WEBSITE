import React, { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { useResponsive } from "../../hooks/useResponsive";
import { APP_CONFIG } from "../../constants";

/**
 * StarField Component - Renders animated stars
 */
const StarField = memo(({ count, variant = "normal" }) => {
  const stars = useMemo(() => {
    return [...Array(count)].map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 1.5 + 0.5,
      delay: Math.random() * 5,
      duration: 3 + Math.random() * 2,
    }));
  }, [count]);

  const starVariants = {
    animate: {
      opacity: [0.2, 0.8, 0.2],
    },
  };

  const brightStarVariants = {
    animate: {
      opacity: [0.4, 0.9, 0.4],
    },
  };

  const isBright = variant === "bright";

  return (
    <>
      {stars.map((star) => (
        <motion.div
          key={star.id}
          variants={isBright ? brightStarVariants : starVariants}
          animate="animate"
          transition={{
            duration: star.duration,
            repeat: Infinity,
            delay: star.delay,
            ease: "easeInOut",
          }}
          className={`absolute rounded-full ${
            isBright ? "bg-cyan-200" : "bg-white"
          }`}
          style={{
            left: star.left,
            top: star.top,
            width: `${star.size}px`,
            height: `${star.size}px`,
            boxShadow: isBright ? "0 0 4px rgba(34, 211, 238, 0.5)" : "none",
            willChange: "opacity",
          }}
        />
      ))}
    </>
  );
});

StarField.displayName = "StarField";

/**
 * FloatingHearts Component - Renders romantic floating hearts
 */
const FloatingHearts = memo(({ count }) => {
  const hearts = useMemo(() => {
    return [...Array(count)].map((_, i) => ({
      id: i,
      left: `${15 + i * (count === 3 ? 25 : 15)}%`,
      top: `${20 + Math.random() * 60}%`,
      fontSize: count === 3 ? 10 : 12 + Math.random() * 6,
      delay: i * 3,
      duration: 8 + i * 2,
    }));
  }, [count]);

  const heartVariants = {
    animate: {
      opacity: [0, 0.4, 0],
      scale: [0.8, 1.2, 0.8],
      y: [0, -30, 0],
    },
  };

  return (
    <>
      {hearts.map((heart) => (
        <motion.div
          key={heart.id}
          variants={heartVariants}
          animate="animate"
          transition={{
            duration: heart.duration,
            repeat: Infinity,
            delay: heart.delay,
            ease: "easeInOut",
          }}
          className="absolute text-pink-300/50"
          style={{
            left: heart.left,
            top: heart.top,
            fontSize: `${heart.fontSize}px`,
            willChange: "transform",
          }}
        >
          ♡
        </motion.div>
      ))}
    </>
  );
});

FloatingHearts.displayName = "FloatingHearts";

/**
 * NebulaCloud Component - Renders animated nebula effects
 */
const NebulaCloud = memo(({ className, gradient, duration, delay = 0 }) => {
  const nebulaVariants = {
    animate: {
      scale: [1, 1.2, 1],
      opacity: [0.1, 0.3, 0.1],
    },
  };

  return (
    <motion.div
      variants={nebulaVariants}
      animate="animate"
      transition={{
        duration,
        repeat: Infinity,
        ease: "linear",
        delay,
      }}
      className={`absolute rounded-full ${className}`}
      style={{
        background: gradient,
        willChange: "transform",
      }}
    />
  );
});

NebulaCloud.displayName = "NebulaCloud";

/**
 * CosmosBackground Component - Main cosmic background with optimized performance
 */
const CosmosBackground = memo(() => {
  const { isMobile, starCount, heartCount } = useResponsive();

  const shootingStarVariants = {
    animate: {
      x: [
        -50,
        typeof window !== "undefined"
          ? isMobile
            ? window.innerWidth / 2
            : window.innerWidth + 50
          : 1000,
      ],
      opacity: [0, 0.8, 0],
    },
  };

  const planetVariants = {
    animate: {
      scale: [1, 1.1, 1],
    },
  };

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Static base layers */}
      <div className="absolute inset-0 bg-black" />
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/30 via-slate-900/20 to-black" />
      <div className="absolute inset-0 bg-gradient-to-tl from-indigo-950/20 via-purple-950/10 to-black/90" />

      {/* Nebula clouds - responsive sizes */}
      <NebulaCloud
        className="absolute -top-16 sm:-top-32 -left-16 sm:-left-32 w-32 h-32 sm:w-64 sm:h-64"
        gradient="radial-gradient(circle, rgba(34, 211, 238, 0.15) 0%, transparent 70%)"
        duration={20}
        style={{
          filter: isMobile ? "blur(20px)" : "blur(40px)",
        }}
      />

      <NebulaCloud
        className="absolute top-1/4 right-0 w-24 h-24 sm:w-48 sm:h-48"
        gradient="radial-gradient(circle, rgba(168, 85, 247, 0.2) 0%, transparent 70%)"
        duration={25}
        delay={10}
        style={{
          filter: isMobile ? "blur(20px)" : "blur(40px)",
        }}
      />

      {/* Star fields */}
      <StarField count={starCount} variant="normal" />
      <StarField
        count={APP_CONFIG.PERFORMANCE.BRIGHT_STAR_COUNT}
        variant="bright"
      />

      {/* Shooting star */}
      <motion.div
        variants={shootingStarVariants}
        animate="animate"
        transition={{
          duration: isMobile ? 0.8 : 1.2,
          repeat: Infinity,
          delay: 8,
          ease: "easeOut",
        }}
        className="absolute h-0.5 bg-gradient-to-r from-transparent via-white to-transparent"
        style={{
          width: isMobile ? "25px" : "40px",
          top: "20%",
          transform: "rotate(15deg)",
          willChange: "transform",
        }}
      />

      {/* Floating hearts */}
      <FloatingHearts count={heartCount} />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-3"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, rgba(96, 165, 250, 0.1) 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
        }}
      />

      {/* Distant planet */}
      <motion.div
        variants={planetVariants}
        animate="animate"
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-20 right-32 w-16 h-16 rounded-full opacity-40"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, rgba(251, 146, 60, 0.3) 0%, rgba(239, 68, 68, 0.1) 100%)",
          filter: "blur(1px)",
          willChange: "transform",
        }}
      />
    </div>
  );
});

CosmosBackground.displayName = "CosmosBackground";

export default CosmosBackground;
