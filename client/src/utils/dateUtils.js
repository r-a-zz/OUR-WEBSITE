import { APP_CONFIG } from "../constants";

/**
 * Calculates the time elapsed since the proposal date
 * @param {Date} proposalDate - The proposal date
 * @param {Date} currentDate - The current date (defaults to now)
 * @returns {Object} Object containing years, months, days, hours, minutes, seconds
 */
export const calculateLoveTime = (
  proposalDate = new Date(APP_CONFIG.PROPOSAL_DATE),
  currentDate = new Date()
) => {
  const totalDiff = currentDate - proposalDate;

  // Safety check for negative time difference
  if (totalDiff < 0) {
    return { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  // Calculate years and months
  let years = currentDate.getFullYear() - proposalDate.getFullYear();
  let months = currentDate.getMonth() - proposalDate.getMonth();

  // Adjust for negative months
  if (months < 0) {
    years--;
    months += 12;
  }

  // Adjust if current day is before proposal day in the month
  if (currentDate.getDate() < proposalDate.getDate()) {
    months--;
    if (months < 0) {
      years--;
      months += 12;
    }
  }

  // Calculate remaining time from the most recent monthly anniversary
  const thisMonthAnniversary = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    proposalDate.getDate(),
    proposalDate.getHours(),
    proposalDate.getMinutes(),
    proposalDate.getSeconds()
  );

  // If we haven't reached this month's anniversary yet, use last month's
  if (currentDate < thisMonthAnniversary) {
    thisMonthAnniversary.setMonth(thisMonthAnniversary.getMonth() - 1);
  }

  const remainingTime = currentDate - thisMonthAnniversary;

  const days = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

  return {
    years: Math.max(0, years),
    months: Math.max(0, months),
    days: Math.max(0, days),
    hours: Math.max(0, hours),
    minutes: Math.max(0, minutes),
    seconds: Math.max(0, seconds),
  };
};

/**
 * Formats time units with leading zeros
 * @param {number} value - The time value to format
 * @returns {string} Formatted time string
 */
export const formatTimeUnit = (value) => value.toString().padStart(2, "0");

/**
 * Checks if the current device is mobile based on screen width
 * @returns {boolean} True if mobile device
 */
export const isMobileDevice = () => {
  return (
    typeof window !== "undefined" &&
    window.innerWidth <= APP_CONFIG.RESPONSIVE_BREAKPOINTS.MOBILE
  );
};

/**
 * Debounces a function call
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};
