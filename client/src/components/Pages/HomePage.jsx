import React, { memo } from "react";
import { motion } from "framer-motion";
import { Rocket, Heart, Stars, Globe } from "lucide-react";
import { useLoveCounter } from "../../hooks/useLoveCounter";
import { useResponsive } from "../../hooks/useResponsive";
import { LOVE_MESSAGES, APP_CONFIG } from "../../constants";

/**
 * FloatingBalloons Component - Subtle floating balloons animation
 */
const FloatingBalloons = memo(() => {
  const balloonVariants = {
    animate: {
      y: [-20, -40, -20],
      x: [-10, 10, -10],
      rotate: [-3, 3, -3],
    },
  };

  const stringVariants = {
    animate: {
      rotate: [-2, 2, -2],
    },
  };

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* First Balloon - Pink */}
      <motion.div
        variants={balloonVariants}
        animate="animate"
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0,
        }}
        className="absolute top-1/4 right-1/4"
        style={{ transform: "translate3d(0, 0, 0)" }}
      >
        {/* Balloon */}
        <div className="relative">
          <div
            className="w-8 h-10 rounded-full bg-gradient-to-b from-pink-400 to-pink-500 shadow-lg opacity-70"
            style={{
              background:
                "radial-gradient(ellipse at 30% 20%, #fbb6ce, #f472b6, #ec4899)",
              filter: "drop-shadow(0 4px 8px rgba(244, 114, 182, 0.3))",
            }}
          />
          {/* String */}
          <motion.div
            variants={stringVariants}
            animate="animate"
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-full left-1/2 w-0.5 h-24 bg-pink-300/40 transform -translate-x-1/2 origin-top"
          />
        </div>
      </motion.div>

      {/* Second Balloon - Purple */}
      <motion.div
        variants={balloonVariants}
        animate="animate"
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 3,
        }}
        className="absolute top-1/3 left-1/5"
        style={{ transform: "translate3d(0, 0, 0)" }}
      >
        {/* Balloon */}
        <div className="relative">
          <div
            className="w-7 h-9 rounded-full bg-gradient-to-b from-purple-400 to-purple-500 shadow-lg opacity-60"
            style={{
              background:
                "radial-gradient(ellipse at 30% 20%, #c4b5fd, #a78bfa, #8b5cf6)",
              filter: "drop-shadow(0 4px 8px rgba(139, 92, 246, 0.3))",
            }}
          />
          {/* String */}
          <motion.div
            variants={stringVariants}
            animate="animate"
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
            className="absolute top-full left-1/2 w-0.5 h-20 bg-purple-300/40 transform -translate-x-1/2 origin-top"
          />
        </div>
      </motion.div>
    </div>
  );
});

FloatingBalloons.displayName = "FloatingBalloons";

/**
 * LoveCounter Component - Main love counter display
 */
const LoveCounter = memo(() => {
  const loveTime = useLoveCounter();
  const { isMobile, isTablet } = useResponsive();

  const containerVariants = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
  };

  const heartAnimation = {
    scale: [1, 1.05, 1],
    rotate: [0, 1, -1, 0],
  };

  const timeUnits = [
    {
      value: loveTime.years,
      label: "Years",
      bgColor: "bg-pink-900/30",
      borderColor: "border-pink-400/20",
      textColor: "text-pink-300",
    },
    {
      value: loveTime.months,
      label: "Months",
      bgColor: "bg-purple-900/30",
      borderColor: "border-purple-400/20",
      textColor: "text-purple-300",
    },
    {
      value: loveTime.days,
      label: "Days",
      bgColor: "bg-red-900/30",
      borderColor: "border-red-400/20",
      textColor: "text-red-300",
    },
    {
      value: loveTime.hours,
      label: "Hours",
      bgColor: "bg-pink-800/30",
      borderColor: "border-pink-400/20",
      textColor: "text-pink-300",
    },
    {
      value: loveTime.minutes,
      label: "Minutes",
      bgColor: "bg-purple-800/30",
      borderColor: "border-purple-400/20",
      textColor: "text-purple-300",
    },
    {
      value: loveTime.seconds,
      label: "Seconds",
      bgColor: "bg-red-800/30",
      borderColor: "border-red-400/20",
      textColor: "text-red-300",
    },
  ];

  const gridCols = isMobile
    ? "grid-cols-2"
    : isTablet
    ? "grid-cols-3"
    : "grid-cols-6";
  const containerSize = isMobile
    ? "max-w-xs"
    : isTablet
    ? "max-w-2xl"
    : "max-w-4xl";

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      transition={{ duration: 0.8, delay: 0.5 }}
      className="mb-8 sm:mb-12 lg:mb-16 text-center px-4"
    >
      <div
        className={`relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-purple-900/40 via-pink-900/40 to-red-900/40 backdrop-blur-xl border border-pink-500/20 p-4 sm:p-6 lg:p-8 mx-auto ${containerSize}`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-red-500/10 animate-pulse" />

        <motion.div
          animate={heartAnimation}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="relative z-10"
        >
          <Heart className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-pink-400 mx-auto mb-3 sm:mb-4 animate-pulse" />
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-pink-300 mb-4 sm:mb-6">
            💖 Our Love Journey Counter 💖
          </h2>

          <div
            className={`grid ${gridCols} gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6`}
          >
            {timeUnits.map((unit, index) => (
              <div
                key={unit.label}
                className={`${unit.bgColor} rounded-lg sm:rounded-xl p-2 sm:p-3 lg:p-4 border ${unit.borderColor}`}
              >
                <div
                  className={`text-xl sm:text-2xl lg:text-3xl font-bold ${unit.textColor}`}
                >
                  {unit.value}
                </div>
                <div
                  className={`${unit.textColor.replace(
                    "300",
                    "400"
                  )} text-xs sm:text-sm`}
                >
                  {unit.label}
                </div>
              </div>
            ))}
          </div>

          <p className="text-sm sm:text-lg lg:text-lg text-pink-200 mb-1 sm:mb-2">
            ✨ Since November 29, 2022 at 10:06 PM ✨
          </p>
          <p className="text-sm sm:text-base lg:text-lg text-pink-300 font-medium">
            {LOVE_MESSAGES.COUNTER_SUBTITLE}
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
});

LoveCounter.displayName = "LoveCounter";

const HomePage = memo(() => {
  const features = [
    {
      icon: Heart,
      title: "Built with Love",
      desc: "Every pixel crafted with love for you ♡",
    },
    {
      icon: Stars,
      title: "You're My Universe",
      desc: "Like stars in the cosmos, you light up my world",
    },
    {
      icon: Rocket,
      title: "Our Love Journey",
      desc: "Together we reach for the stars and beyond",
    },
  ];

  return (
    <div className="relative space-y-8 sm:space-y-12 lg:space-y-16 px-4 sm:px-6 lg:px-8">
      {/* Floating Balloons */}
      <FloatingBalloons />

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="text-center space-y-6 sm:space-y-8"
      >
        <motion.h1
          className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-bold text-white mb-4 sm:mb-6 leading-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          Happy Birthday My
          <span
            className="block bg-gradient-to-r from-pink-400 via-red-400 to-purple-400 bg-clip-text text-transparent"
            style={{
              filter: "drop-shadow(0 0 15px rgba(244, 114, 182, 0.3))",
            }}
          >
            Beautiful Universe ♡
          </span>
        </motion.h1>

        <motion.p
          className="text-base sm:text-lg md:text-xl lg:text-2xl text-pink-100/90 max-w-xs sm:max-w-2xl lg:max-w-3xl mx-auto leading-relaxed px-4"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          style={{
            textShadow: "0 0 20px rgba(244, 114, 182, 0.3)",
          }}
        >
          You are my star, my moon, my entire galaxy. On your special day, I
          wanted to create something as beautiful and infinite as my love for
          you. Happy Birthday, my darling! ♡
        </motion.p>

        {/* Love anniversary message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 1 }}
          className="mt-3 sm:mt-4 text-center"
        >
          <span className="text-pink-300/80 text-sm sm:text-base lg:text-lg italic">
            ✨ From the day you said yes (29th Nov 2022) to forever ✨
          </span>
        </motion.div>

        <motion.div
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center pt-4 sm:pt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          <motion.button
            whileHover={{
              scale: 1.05,
              boxShadow:
                "0 20px 40px rgba(34, 211, 238, 0.4), 0 0 60px rgba(168, 85, 247, 0.3)",
            }}
            whileTap={{ scale: 0.95 }}
            className="group px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-cyan-500 via-purple-500 to-violet-600 text-white font-semibold rounded-full hover:from-cyan-400 hover:via-purple-400 hover:to-violet-500 transition-all duration-300 shadow-lg shadow-purple-500/25 border border-cyan-400/30 flex items-center space-x-2 w-full sm:w-auto justify-center touch-manipulation"
            style={{
              background: "linear-gradient(45deg, #06b6d4, #8b5cf6, #7c3aed)",
              boxShadow:
                "0 8px 32px rgba(34, 211, 238, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
            }}
          >
            <span className="text-sm sm:text-base">Launch Journey</span>
            <Rocket
              size={16}
              className="sm:w-[18px] sm:h-[18px] group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"
            />
          </motion.button>

          <motion.button
            whileHover={{
              scale: 1.05,
              boxShadow: "0 0 30px rgba(34, 211, 238, 0.3)",
            }}
            whileTap={{ scale: 0.95 }}
            className="px-6 sm:px-8 py-3 sm:py-4 border-2 border-cyan-400/40 text-cyan-100 font-semibold rounded-full hover:bg-cyan-500/10 hover:border-cyan-300/60 transition-all duration-300 backdrop-blur-sm w-full sm:w-auto text-sm sm:text-base touch-manipulation"
            style={{
              background: "rgba(34, 211, 238, 0.05)",
              boxShadow: "inset 0 1px 0 rgba(34, 211, 238, 0.2)",
            }}
          >
            Explore Galaxy
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Love Counter */}
      <LoveCounter />

      {/* Features Grid */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.8 }}
      >
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 + index * 0.2, duration: 0.6 }}
            whileHover={{
              y: -10,
              transition: { type: "spring", stiffness: 300, damping: 10 },
            }}
            className="bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-violet-500/10 backdrop-blur-xl rounded-xl sm:rounded-2xl p-6 sm:p-8 border border-cyan-400/30 hover:border-purple-400/50 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 text-center group touch-manipulation"
            style={{
              background:
                "linear-gradient(135deg, rgba(34, 211, 238, 0.1) 0%, rgba(168, 85, 247, 0.1) 50%, rgba(124, 58, 237, 0.1) 100%)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.1), 0 8px 32px rgba(34, 211, 238, 0.1)",
            }}
          >
            <motion.div
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-r from-cyan-400 via-purple-500 to-violet-600 rounded-full mb-4 sm:mb-6 shadow-lg shadow-purple-500/40"
              style={{
                background: "linear-gradient(45deg, #22d3ee, #8b5cf6, #7c3aed)",
                boxShadow:
                  "0 8px 25px rgba(34, 211, 238, 0.4), inset 0 1px 0 rgba(255,255,255,0.3)",
              }}
            >
              <feature.icon
                size={20}
                className="sm:w-6 sm:h-6 lg:w-6 lg:h-6 text-white drop-shadow-lg"
              />
            </motion.div>
            <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-white mb-3 sm:mb-4 group-hover:text-cyan-300 transition-colors">
              {feature.title}
            </h3>
            <p className="text-sm sm:text-base text-cyan-100/80 leading-relaxed">
              {feature.desc}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Stats Section */}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.8 }}
      >
        {[
          { number: "∞", label: "My Love for You" },
          { number: "1", label: "Soulmate ♡" },
          { number: "♡∞", label: "Kisses & Hugs" },
          { number: "Forever", label: "Together" },
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              delay: 1.6 + index * 0.1,
              type: "spring",
              stiffness: 200,
              damping: 10,
            }}
            className="space-y-1 sm:space-y-2"
          >
            <motion.div
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-pink-400 via-red-400 to-purple-400 bg-clip-text text-transparent drop-shadow-lg"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                filter: "drop-shadow(0 0 10px rgba(34, 211, 238, 0.3))",
              }}
            >
              {stat.number}
            </motion.div>
            <div className="text-cyan-200/80 font-medium tracking-wide text-xs sm:text-sm lg:text-base">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
});

HomePage.displayName = "HomePage";

export default HomePage;
