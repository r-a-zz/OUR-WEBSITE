import React from "react";
import { useSpring, animated } from "@react-spring/web";

export function EmptyState({ icon: Icon, title, description, action }) {
  const style = useSpring({
    from: { opacity: 0, transform: "translateY(8px)" },
    to: { opacity: 1, transform: "translateY(0px)" },
    config: { tension: 220, friction: 26 },
  });

  return (
    <animated.div
      style={style}
      className="flex flex-col items-center justify-center min-h-[40vh] text-center"
    >
      <div className="bg-white/5 p-6 rounded-full mb-6">
        {Icon && <Icon size={48} className="text-white/60" />}
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-white/70 mb-6 max-w-md">{description}</p>
      {action}
    </animated.div>
  );
}
