/**
 * @fileoverview Enhanced responsive design hook with performance optimization and error handling
 * @author SDE3 Frontend Engineer
 * @version 2.0.0
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { APP_CONFIG } from "../constants";
import { debounce } from "../utils/dateUtils";
import { logger, perfMonitor } from "../utils/debugUtils";
import { COMPONENT_NAMES } from "../types";

const COMPONENT_NAME = COMPONENT_NAMES.RESPONSIVE_HOOK || "useResponsive";

/**
 * Enhanced responsive design hook with performance optimization
 * @returns {ResponsiveConfig} Responsive utilities and screen size information
 */
export const useResponsive = () => {
  // Initialize with SSR-safe values
  const getInitialScreenSize = useCallback(() => {
    if (typeof window === "undefined") {
      return { width: 0, height: 0 };
    }
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }, []);

  const [screenSize, setScreenSize] = useState(getInitialScreenSize);
  const [isHydrated, setIsHydrated] = useState(false);

  // Memoized device type calculation for performance
  const deviceType = useMemo(() => {
    const { width } = screenSize;
    const { MOBILE, TABLET } = APP_CONFIG.RESPONSIVE_BREAKPOINTS;

    const result = {
      isMobile: width <= MOBILE,
      isTablet: width > MOBILE && width <= TABLET,
      isDesktop: width > TABLET,
    };

    // Only log in development and when values actually change
    if (process.env.NODE_ENV === "development" && isHydrated) {
      logger.debug(COMPONENT_NAME, "Device type updated", {
        width,
        breakpoints: { MOBILE, TABLET },
        ...result,
      });
    }

    return result;
  }, [screenSize.width, isHydrated]);

  // Performance-optimized star and heart counts
  const performanceConfig = useMemo(
    () => ({
      starCount: deviceType.isMobile
        ? APP_CONFIG.PERFORMANCE.MOBILE_STAR_COUNT
        : APP_CONFIG.PERFORMANCE.DESKTOP_STAR_COUNT,
      heartCount: deviceType.isMobile
        ? APP_CONFIG.PERFORMANCE.HEART_COUNT_MOBILE
        : APP_CONFIG.PERFORMANCE.HEART_COUNT_DESKTOP,
    }),
    [deviceType.isMobile]
  );

  // Optimized screen size update function
  const updateScreenSize = useCallback(() => {
    if (typeof window === "undefined") {
      logger.warn(COMPONENT_NAME, "Window object not available");
      return;
    }

    perfMonitor.start("updateScreenSize");

    const newSize = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    // Only update if size actually changed (prevents unnecessary re-renders)
    setScreenSize((currentSize) => {
      if (
        currentSize.width === newSize.width &&
        currentSize.height === newSize.height
      ) {
        return currentSize;
      }
      return newSize;
    });

    perfMonitor.end("updateScreenSize", COMPONENT_NAME);
  }, []);

  // Debounced resize handler with error boundary
  const debouncedUpdateScreenSize = useMemo(
    () => debounce(updateScreenSize, 150),
    [updateScreenSize]
  );

  useEffect(() => {
    // SSR hydration guard
    if (typeof window === "undefined") return;

    try {
      // Initial update
      updateScreenSize();
      setIsHydrated(true);

      // Add resize listener
      window.addEventListener("resize", debouncedUpdateScreenSize, {
        passive: true,
      });

      logger.info(COMPONENT_NAME, "Responsive hook initialized", {
        initialSize: screenSize,
        breakpoints: APP_CONFIG.RESPONSIVE_BREAKPOINTS,
      });

      // Cleanup function
      return () => {
        window.removeEventListener("resize", debouncedUpdateScreenSize);
        logger.debug(COMPONENT_NAME, "Responsive hook cleanup completed");
      };
    } catch (error) {
      logger.error(COMPONENT_NAME, "Error in useResponsive setup", {
        error: error.message,
        stack: error.stack,
      });
    }
  }, [debouncedUpdateScreenSize, updateScreenSize, screenSize]);

  // Return memoized result to prevent unnecessary re-renders
  return useMemo(
    () => ({
      screenSize,
      ...deviceType,
      ...performanceConfig,
      isHydrated,
    }),
    [screenSize, deviceType, performanceConfig, isHydrated]
  );
};
