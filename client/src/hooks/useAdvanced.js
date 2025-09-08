/**
 * @fileoverview Advanced custom hooks for enhanced functionality
 * @author SDE3 Frontend Engineer
 * @version 1.0.0
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { logger } from "../utils/debugUtils";

/**
 * Enhanced click outside hook with performance optimization
 * @param {React.RefObject} ref - Reference to the element
 * @param {Function} handler - Handler function to call when clicked outside
 * @param {boolean} enabled - Whether the hook is enabled
 */
export const useClickOutside = (ref, handler, enabled = true) => {
  const handlerRef = useRef(handler);

  // Keep handler reference up to date
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled) return;

    const handleClick = (event) => {
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      handlerRef.current(event);
    };

    // Use capture phase for better performance
    document.addEventListener("mousedown", handleClick, true);
    document.addEventListener("touchstart", handleClick, true);

    return () => {
      document.removeEventListener("mousedown", handleClick, true);
      document.removeEventListener("touchstart", handleClick, true);
    };
  }, [ref, enabled]);
};

/**
 * Enhanced keyboard navigation hook
 * @param {Object} options - Configuration options
 * @param {Function} options.onEscape - Escape key handler
 * @param {Function} options.onEnter - Enter key handler
 * @param {Function} options.onArrowUp - Arrow up handler
 * @param {Function} options.onArrowDown - Arrow down handler
 * @param {boolean} options.enabled - Whether the hook is enabled
 */
export const useKeyboardNavigation = ({
  onEscape,
  onEnter,
  onArrowUp,
  onArrowDown,
  enabled = true,
}) => {
  const handlersRef = useRef({ onEscape, onEnter, onArrowUp, onArrowDown });

  // Keep handlers up to date
  useEffect(() => {
    handlersRef.current = { onEscape, onEnter, onArrowUp, onArrowDown };
  }, [onEscape, onEnter, onArrowUp, onArrowDown]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event) => {
      const handlers = handlersRef.current;

      switch (event.key) {
        case "Escape":
          handlers.onEscape?.(event);
          break;
        case "Enter":
          handlers.onEnter?.(event);
          break;
        case "ArrowUp":
          event.preventDefault();
          handlers.onArrowUp?.(event);
          break;
        case "ArrowDown":
          event.preventDefault();
          handlers.onArrowDown?.(event);
          break;
        default:
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled]);
};

/**
 * Focus management hook for accessibility
 * @param {boolean} isOpen - Whether the component is open/visible
 * @param {React.RefObject} containerRef - Reference to the container
 */
export const useFocusManagement = (isOpen, containerRef) => {
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (isOpen) {
      // Store the currently focused element
      previousFocusRef.current = document.activeElement;

      // Focus the first focusable element in the container
      const focusableElements = containerRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    } else {
      // Restore focus to the previously focused element
      if (
        previousFocusRef.current &&
        typeof previousFocusRef.current.focus === "function"
      ) {
        previousFocusRef.current.focus();
      }
    }
  }, [isOpen, containerRef]);
};

/**
 * Optimized local storage hook with error handling
 * @param {string} key - Storage key
 * @param {*} initialValue - Initial value
 * @returns {[*, Function]} Current value and setter function
 */
export const useLocalStorage = (key, initialValue) => {
  // Memoize the initial value calculation
  const [storedValue, setStoredValue] = useState(() => {
    try {
      if (typeof window === "undefined") return initialValue;

      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      logger.error(
        "useLocalStorage",
        `Error reading localStorage key "${key}"`,
        { error: error.message }
      );
      return initialValue;
    }
  });

  // Memoized setter function
  const setValue = useCallback(
    (value) => {
      try {
        // Allow value to be a function for functional updates
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);

        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        logger.error(
          "useLocalStorage",
          `Error setting localStorage key "${key}"`,
          { error: error.message }
        );
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue];
};

/**
 * Debounced state hook for performance optimization
 * @param {*} value - Value to debounce
 * @param {number} delay - Debounce delay in milliseconds
 * @returns {*} Debounced value
 */
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Previous value hook for comparison
 * @param {*} value - Current value
 * @returns {*} Previous value
 */
export const usePrevious = (value) => {
  const ref = useRef();

  useEffect(() => {
    ref.current = value;
  });

  return ref.current;
};

/**
 * Intersection Observer hook for lazy loading and animations
 * @param {Object} options - Intersection Observer options
 * @returns {[Function, boolean]} Ref setter and intersection state
 */
export const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [element, setElement] = useState(null);

  useEffect(() => {
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: "0px",
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [element, options]);

  return [setElement, isIntersecting];
};
