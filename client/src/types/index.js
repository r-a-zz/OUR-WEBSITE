/**
 * @fileoverview TypeScript-like type definitions for better IDE support and code documentation
 * @author SDE3 Frontend Engineer
 * @version 1.0.0
 */

/**
 * @typedef {Object} DeviceType
 * @property {boolean} isMobile - Whether the device is mobile (≤768px)
 * @property {boolean} isTablet - Whether the device is tablet (769px-1024px)
 * @property {boolean} isDesktop - Whether the device is desktop (>1024px)
 */

/**
 * @typedef {Object} ScreenSize
 * @property {number} width - Screen width in pixels
 * @property {number} height - Screen height in pixels
 */

/**
 * @typedef {Object} ResponsiveConfig
 * @property {ScreenSize} screenSize - Current screen dimensions
 * @property {boolean} isMobile - Mobile device flag
 * @property {boolean} isTablet - Tablet device flag
 * @property {boolean} isDesktop - Desktop device flag
 * @property {number} starCount - Performance-optimized star count
 * @property {number} heartCount - Performance-optimized heart count
 */

/**
 * @typedef {Object} LoveTime
 * @property {number} years - Years since relationship start
 * @property {number} months - Months since relationship start
 * @property {number} days - Days since relationship start
 * @property {number} hours - Hours since relationship start
 * @property {number} minutes - Minutes since relationship start
 * @property {number} seconds - Seconds since relationship start
 */

/**
 * @typedef {Object} NavigationItem
 * @property {string} id - Unique identifier for the navigation item
 * @property {string} label - Display label for the navigation item
 * @property {React.ComponentType} icon - Lucide React icon component
 */

/**
 * @typedef {Object} AppState
 * @property {string} activeSection - Currently active section/page
 * @property {boolean} sidebarOpen - Sidebar visibility state
 * @property {boolean} loading - Global loading state
 * @property {string} theme - Current theme ('dark' | 'light')
 */

/**
 * @typedef {Object} AppActions
 * @property {function(string): void} setActiveSection - Set active section
 * @property {function(): void} toggleSidebar - Toggle sidebar visibility
 * @property {function(boolean): void} setSidebarOpen - Set sidebar visibility
 * @property {function(boolean): void} setLoading - Set loading state
 * @property {function(string): void} setTheme - Set theme
 */

/**
 * @typedef {AppState & AppActions} AppContextValue
 */

// Animation variants for consistent motion design
export const ANIMATION_VARIANTS = {
  SIDEBAR: {
    hidden: { x: "-100%" },
    visible: { x: 0 },
    exit: { x: "-100%" },
  },
  OVERLAY: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  },
  FADE_IN: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  },
  SCALE: {
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
  },
};

// Standardized transition configurations
export const TRANSITIONS = {
  FAST: { duration: 0.15, ease: "easeOut" },
  NORMAL: { duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] },
  SLOW: { duration: 0.4, ease: "easeInOut" },
  SPRING: { type: "spring", stiffness: 300, damping: 10 },
};

// Error boundaries and logging levels
export const LOG_LEVELS = {
  ERROR: "error",
  WARN: "warn",
  INFO: "info",
  DEBUG: "debug",
};

export const COMPONENT_NAMES = {
  SIDEBAR: "Sidebar",
  HEADER: "Header",
  NAVIGATION_ITEM: "NavigationItem",
  LOVE_COUNTER: "LoveCounterDisplay",
  SIDEBAR_OVERLAY: "SidebarOverlay",
  RESPONSIVE_HOOK: "useResponsive",
  APP_CONTEXT: "AppContext",
  ERROR_BOUNDARY: "ErrorBoundary",
};
