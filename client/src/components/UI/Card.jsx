import React from "react";
import { designTokens } from "../../utils/designTokens";
import { useSpring, animated } from "@react-spring/web";

export default function Card({
  children,
  variant = "default",
  className = "",
  onClick,
  ...props
}) {
  const baseClasses = [
    designTokens.colors.glass.light,
    designTokens.effects.blur,
    "rounded-2xl",
    designTokens.spacing.card,
    designTokens.colors.border.medium,
    "border",
    designTokens.effects.transition,
  ].join(" ");

  const variants = {
    default: "hover:bg-white/15",
    interactive: "hover:bg-white/15 cursor-pointer",
    highlighted: "bg-white/15 border-blue-400/30 shadow-lg",
  };

  const cardClasses = `${baseClasses} ${
    variants[variant] || ""
  } ${className}`.trim();

  const [style, api] = useSpring(() => ({
    transform: "scale(1)",
    config: { tension: 220, friction: 20 },
  }));

  return (
    <animated.div
      style={style}
      onMouseEnter={() => api.start({ transform: "scale(1.01)" })}
      onMouseLeave={() => api.start({ transform: "scale(1)" })}
      className={cardClasses}
      onClick={onClick}
      {...props}
    >
      {children}
    </animated.div>
  );
}
