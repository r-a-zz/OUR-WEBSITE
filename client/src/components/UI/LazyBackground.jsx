import React, { memo, useMemo } from "react";
import { useSpring, animated } from "@react-spring/web";

const FloatingParticles = memo(({ count = 20 }) => {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 5}s`,
        animationDuration: `${2 + Math.random() * 3}s`,
      })),
    [count]
  );

  return (
    <>
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-1 h-1 bg-white/30 rounded-full animate-pulse"
          style={{
            left: particle.left,
            top: particle.top,
            animationDelay: particle.animationDelay,
            animationDuration: particle.animationDuration,
          }}
        />
      ))}
    </>
  );
});

const LazyBackground = memo(() => {
  const orb = useSpring({
    from: { y: -6 },
    to: { y: 6 },
    loop: { reverse: true },
    config: { duration: 4000 },
  });

  return (
    <div className="absolute inset-0" aria-hidden>
      {/* Animated gradient orbs */}
      <animated.div
        style={{ transform: orb.y.to((y) => `translateY(${y}px)`) }}
        className="absolute top-0 left-0 w-96 h-96 bg-purple-500/30 rounded-full mix-blend-multiply filter blur-xl opacity-70"
      />
      <animated.div
        style={{ transform: orb.y.to((y) => `translateY(${y * -1}px)`) }}
        className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/30 rounded-full mix-blend-multiply filter blur-xl opacity-70"
      />
      <animated.div
        style={{ transform: orb.y.to((y) => `translateY(${y * 0.6}px)`) }}
        className="absolute -bottom-20 left-20 w-96 h-96 bg-pink-500/30 rounded-full mix-blend-multiply filter blur-xl opacity-70"
      />
      <animated.div
        style={{ transform: orb.y.to((y) => `translateY(${y * 0.3}px)`) }}
        className="absolute bottom-0 right-20 w-80 h-80 bg-emerald-500/20 rounded-full mix-blend-multiply filter blur-xl opacity-60"
      />

      {/* Optimized floating particles */}
      <FloatingParticles count={20} />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>
    </div>
  );
});

export default LazyBackground;
