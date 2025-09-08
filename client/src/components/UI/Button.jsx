import React from "react";
import { useSpringFade } from "../../hooks/useSpringFade";

export default function Button({
  children,
  className = "",
  animate = false,
  ...props
}) {
  if (animate) {
    const { styles, animated } = useSpringFade(true);
    const AnimatedBtn = animated("button");
    return (
      <AnimatedBtn
        style={styles}
        className={`px-4 py-2 rounded ${className}`}
        {...props}
      >
        {children}
      </AnimatedBtn>
    );
  }

  return (
    <button className={`px-4 py-2 rounded ${className}`} {...props}>
      {children}
    </button>
  );
}
