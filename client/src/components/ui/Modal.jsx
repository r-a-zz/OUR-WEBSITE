import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useKeyboard } from "../../hooks/useKeyboard";
import { FocusTrap } from "./FocusTrap";
import { useTransition, animated } from "@react-spring/web";

export default function Modal({ open, onClose, title, children, size = "md" }) {
  const modalRef = useRef(null);

  useKeyboard({
    Escape: () => {
      if (open) onClose?.();
    },
  });

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      const announcement = document.createElement("div");
      announcement.setAttribute("aria-live", "polite");
      announcement.setAttribute("aria-atomic", "true");
      announcement.className = "sr-only";
      announcement.textContent = `Dialog opened: ${title || "dialog"}`;
      document.body.appendChild(announcement);

      return () => {
        document.body.style.overflow = "unset";
        document.body.removeChild(announcement);
      };
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open, title, onClose]);

  if (!open) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    full: "max-w-7xl",
  };

  const transitions = useTransition(open, {
    from: { opacity: 0, transform: "scale(0.98)" },
    enter: { opacity: 1, transform: "scale(1)" },
    leave: { opacity: 0, transform: "scale(0.98)" },
    config: { tension: 220, friction: 20 },
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-title"
    >
      {transitions((style, item) =>
        item ? (
          <animated.div style={style} className="relative z-10 w-full mx-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={onClose}
              aria-hidden="true"
            />

            <FocusTrap active={open}>
              <div
                ref={modalRef}
                className={`relative z-10 w-full mx-4 ${sizeClasses[size]}`}
              >
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h2
                      id="modal-title"
                      className="text-lg font-semibold text-white"
                    >
                      {title}
                    </h2>
                    <button
                      onClick={onClose}
                      className="text-white/80 hover:text-white p-1 rounded transition"
                      aria-label="Close dialog"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  {children}
                </div>
              </div>
            </FocusTrap>
          </animated.div>
        ) : null
      )}
    </div>
  );
}
