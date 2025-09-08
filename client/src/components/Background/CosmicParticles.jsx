import React from "react";
import { motion } from "framer-motion";

const CosmicParticles = ({ count = 30 }) => {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 0.5,
    opacity: Math.random() * 0.9 + 0.1,
    color: ["#00ffff", "#0080ff", "#8000ff", "#ff0080", "#ff69b4", "#00ff80"][
      Math.floor(Math.random() * 6)
    ],
    duration: Math.random() * 15 + 8,
    delay: Math.random() * 3,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          animate={{
            y: [0, -100, 0],
            x: [0, Math.random() * 60 - 30, 0],
            opacity: [0, particle.opacity, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut",
          }}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            filter: `blur(${particle.size * 0.3}px) brightness(1.5)`,
            boxShadow: `0 0 ${particle.size * 4}px ${particle.color}80, 0 0 ${
              particle.size * 8
            }px ${particle.color}40`,
          }}
        />
      ))}
    </div>
  );
};

export default CosmicParticles;
