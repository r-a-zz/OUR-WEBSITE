import React from 'react';
import { motion } from 'framer-motion';

const AnimatedBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Cosmos Base Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900" />
      <motion.div 
        animate={{ 
          opacity: [0.6, 0.9, 0.6] 
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute inset-0 bg-gradient-to-tl from-blue-900 via-indigo-900 to-black opacity-80" 
      />
      
      {/* Large Nebula Clouds */}
      <motion.div 
        animate={{
          scale: [1, 1.3, 1],
          rotate: [0, 360],
          opacity: [0.2, 0.6, 0.2],
          x: [0, 50, 0],
          y: [0, -30, 0]
        }}
        transition={{
          duration: 40,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute -top-48 -left-48 w-96 h-96 rounded-full filter blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.3) 0%, rgba(59, 130, 246, 0.15) 40%, transparent 70%)'
        }}
      />
      
      <motion.div 
        animate={{
          scale: [1.2, 1, 1.2],
          rotate: [360, 0, -360],
          opacity: [0.6, 0.2, 0.6],
          x: [0, -40, 0],
          y: [0, 20, 0]
        }}
        transition={{
          duration: 35,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 8
        }}
        className="absolute top-1/4 -right-24 w-80 h-80 rounded-full filter blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, rgba(236, 72, 153, 0.2) 40%, transparent 70%)'
        }}
      />
      
      <motion.div 
        animate={{
          scale: [1, 1.4, 1],
          rotate: [0, -180, -360],
          opacity: [0.3, 0.7, 0.3],
          x: [0, 30, 0],
          y: [0, -40, 0]
        }}
        transition={{
          duration: 45,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 15
        }}
        className="absolute -bottom-32 left-1/3 w-72 h-72 rounded-full filter blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.35) 0%, rgba(124, 58, 237, 0.15) 40%, transparent 70%)'
        }}
      />

      {/* Animated gradient orbs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360],
          opacity: [0.3, 0.7, 0.3],
          x: [0, 20, 0],
          y: [0, -15, 0]
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-0 left-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-30"
      />

      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          rotate: [360, 180, 0],
          opacity: [0.7, 0.3, 0.7],
          x: [0, -25, 0],
          y: [0, 10, 0]
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 5,
        }}
        className="absolute top-0 right-0 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-30"
      />

      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          rotate: [0, -180, -360],
          opacity: [0.3, 0.6, 0.3],
          x: [0, 15, 0],
          y: [0, -20, 0]
        }}
        transition={{
          duration: 35,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 10,
        }}
        className="absolute -bottom-20 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-30"
      />

      <motion.div
        animate={{
          scale: [1.1, 1, 1.1],
          rotate: [-360, -180, 0],
          opacity: [0.6, 0.3, 0.6],
          x: [0, -10, 0],
          y: [0, 25, 0]
        }}
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 15,
        }}
        className="absolute bottom-0 right-20 w-80 h-80 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-20"
      />

      {/* Floating particles with individual animations */}
      {[...Array(40)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -40 - Math.random() * 20, 0],
            x: [0, Math.random() * 30 - 15, 0],
            opacity: [0, 0.8, 0],
            scale: [0, 1 + Math.random() * 0.5, 0],
          }}
          transition={{
            duration: 4 + Math.random() * 6,
            repeat: Infinity,
            delay: Math.random() * 8,
            ease: "easeInOut",
          }}
          className="absolute w-1 h-1 bg-white rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
        />
      ))}

      {/* Shooting stars */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`star-${i}`}
          animate={{
            x: [-100, window.innerWidth + 100],
            y: [Math.random() * 200, Math.random() * 200 + 100],
            opacity: [0, 1, 1, 0],
            scale: [0, 1, 1, 0]
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 15 + i * 5,
            ease: "easeOut",
          }}
          className="absolute w-2 h-0.5 bg-gradient-to-r from-white via-blue-200 to-transparent rounded-full shadow-lg"
          style={{
            filter: 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.8))'
          }}
        />
      ))}

      {/* Subtle grid pattern overlay with breathing effect */}
      <motion.div 
        animate={{ 
          opacity: [0.02, 0.08, 0.02] 
        }}
        transition={{ 
          duration: 12, 
          repeat: Infinity,
          ease: "easeInOut" 
        }}
        className="absolute inset-0"
      >
        <div
          className="h-full w-full"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "80px 80px",
          }}
        />
      </motion.div>

      {/* Gentle pulse overlay for depth */}
      <motion.div
        animate={{
          opacity: [0.1, 0.3, 0.1],
          scale: [1, 1.02, 1]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute inset-0 bg-gradient-radial from-purple-500/10 via-transparent to-transparent"
      />

      {/* Twinkling stars - More centered with enhanced glow */}
      {[...Array(80)].map((_, i) => {
        const centerX = 50 + (Math.random() - 0.5) * 80; // More centered distribution
        const centerY = 50 + (Math.random() - 0.5) * 80;
        return (
          <motion.div
            key={`twinkle-${i}`}
            animate={{
              opacity: [0, 1, 0],
              scale: [0.5, 2, 0.5]
            }}
            transition={{
              duration: 3 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 10,
              ease: "easeInOut"
            }}
            className="absolute w-0.5 h-0.5 bg-white rounded-full"
            style={{
              left: `${centerX}%`,
              top: `${centerY}%`,
              filter: 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.9)) drop-shadow(0 0 12px rgba(147, 51, 234, 0.4))'
            }}
          />
        );
      })}
    </div>
  );
};

export default AnimatedBackground;