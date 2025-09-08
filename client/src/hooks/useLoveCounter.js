import { useState, useEffect, useRef } from "react";
import { calculateLoveTime } from "../utils/dateUtils";
import { APP_CONFIG } from "../constants";

/**
 * Custom hook for managing the love counter state
 * @returns {Object} Love time object with years, months, days, hours, minutes, seconds
 */
export const useLoveCounter = () => {
  const [loveTime, setLoveTime] = useState({
    years: 0,
    months: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const intervalRef = useRef(null);

  const updateLoveTime = () => {
    const newLoveTime = calculateLoveTime();
    setLoveTime(newLoveTime);
  };

  useEffect(() => {
    // Initial calculation
    updateLoveTime();

    // Set up interval for real-time updates
    intervalRef.current = setInterval(
      updateLoveTime,
      APP_CONFIG.LOVE_COUNTER_UPDATE_INTERVAL
    );

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return loveTime;
};
