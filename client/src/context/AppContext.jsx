/**
 * @fileoverview Enhanced Application Context with enterprise-grade state management
 * @author SDE3 Frontend Engineer
 * @version 2.0.0
 *
 * Features:
 * - Type-safe state management with JSDoc
 * - Performance optimization with useMemo and useCallback
 * - Comprehensive error handling and logging
 * - Immutable state updates
 * - Development debugging support
 * - Local storage persistence for user preferences
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import { logger } from "../utils/debugUtils";
import { useLocalStorage } from "../hooks/useAdvanced";

const COMPONENT_NAME = "AppContext";

// Enhanced action types with better naming
const ACTION_TYPES = {
  SET_ACTIVE_SECTION: "SET_ACTIVE_SECTION",
  TOGGLE_SIDEBAR: "TOGGLE_SIDEBAR",
  SET_SIDEBAR_OPEN: "SET_SIDEBAR_OPEN",
  SET_LOADING: "SET_LOADING",
  SET_THEME: "SET_THEME",
  SET_ERROR: "SET_ERROR",
  CLEAR_ERROR: "CLEAR_ERROR",
  SET_USER_PREFERENCES: "SET_USER_PREFERENCES",
};

// Enhanced initial state with error handling
const createInitialState = () => ({
  activeSection: "home",
  sidebarOpen: false,
  loading: false,
  theme: "dark",
  error: null,
  userPreferences: {
    animationsEnabled: true,
    autoCloseMenu: true,
    debugMode: false,
  },
});

/**
 * Enhanced reducer with immutability and logging
 * @param {AppState} state - Current state
 * @param {Object} action - Action object with type and payload
 * @returns {AppState} New state
 */
const appReducer = (state, action) => {
  logger.debug(COMPONENT_NAME, `Action dispatched: ${action.type}`, {
    currentState: state,
    action,
  });

  switch (action.type) {
    case ACTION_TYPES.SET_ACTIVE_SECTION: {
      const newState = {
        ...state,
        activeSection: action.payload,
        error: null, // Clear any errors when navigating
      };

      logger.info(COMPONENT_NAME, "Active section changed", {
        from: state.activeSection,
        to: action.payload,
      });

      return newState;
    }

    case ACTION_TYPES.TOGGLE_SIDEBAR: {
      const newSidebarState = !state.sidebarOpen;

      logger.debug(COMPONENT_NAME, "Sidebar toggled", {
        from: state.sidebarOpen,
        to: newSidebarState,
      });

      return {
        ...state,
        sidebarOpen: newSidebarState,
      };
    }

    case ACTION_TYPES.SET_SIDEBAR_OPEN: {
      if (state.sidebarOpen === action.payload) {
        return state; // Prevent unnecessary re-renders
      }

      return {
        ...state,
        sidebarOpen: action.payload,
      };
    }

    case ACTION_TYPES.SET_LOADING: {
      return {
        ...state,
        loading: action.payload,
      };
    }

    case ACTION_TYPES.SET_THEME: {
      logger.info(COMPONENT_NAME, "Theme changed", {
        from: state.theme,
        to: action.payload,
      });

      return {
        ...state,
        theme: action.payload,
      };
    }

    case ACTION_TYPES.SET_ERROR: {
      logger.error(COMPONENT_NAME, "Error set in state", {
        error: action.payload,
      });

      return {
        ...state,
        error: action.payload,
      };
    }

    case ACTION_TYPES.CLEAR_ERROR: {
      return {
        ...state,
        error: null,
      };
    }

    case ACTION_TYPES.SET_USER_PREFERENCES: {
      logger.info(COMPONENT_NAME, "User preferences updated", {
        preferences: action.payload,
      });

      return {
        ...state,
        userPreferences: {
          ...state.userPreferences,
          ...action.payload,
        },
      };
    }

    default: {
      logger.warn(COMPONENT_NAME, `Unknown action type: ${action.type}`, {
        action,
      });
      return state;
    }
  }
};

// Create context with better typing
const AppContext = createContext(null);

/**
 * Enhanced App Provider with comprehensive state management
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, null, createInitialState);
  const [persistedPreferences, setPersistedPreferences] = useLocalStorage(
    "userPreferences",
    state.userPreferences
  );

  // Sync persisted preferences with state
  useEffect(() => {
    if (
      persistedPreferences &&
      JSON.stringify(persistedPreferences) !==
        JSON.stringify(state.userPreferences)
    ) {
      dispatch({
        type: ACTION_TYPES.SET_USER_PREFERENCES,
        payload: persistedPreferences,
      });
    }
  }, [persistedPreferences, state.userPreferences]);

  // Enhanced action creators with error handling
  const setActiveSection = useCallback((section) => {
    try {
      if (!section || typeof section !== "string") {
        throw new Error("Invalid section provided");
      }

      dispatch({
        type: ACTION_TYPES.SET_ACTIVE_SECTION,
        payload: section.toLowerCase(),
      });
    } catch (error) {
      logger.error(COMPONENT_NAME, "Error setting active section", {
        error: error.message,
        section,
      });

      dispatch({
        type: ACTION_TYPES.SET_ERROR,
        payload: `Failed to navigate to ${section}`,
      });
    }
  }, []);

  const toggleSidebar = useCallback(() => {
    try {
      logger.debug(COMPONENT_NAME, "toggleSidebar called", {
        currentState: state.sidebarOpen,
      });

      dispatch({ type: ACTION_TYPES.TOGGLE_SIDEBAR });
    } catch (error) {
      logger.error(COMPONENT_NAME, "Error toggling sidebar", {
        error: error.message,
      });
    }
  }, [state.sidebarOpen]);

  const setSidebarOpen = useCallback((isOpen) => {
    try {
      if (typeof isOpen !== "boolean") {
        throw new Error("setSidebarOpen expects a boolean value");
      }

      dispatch({
        type: ACTION_TYPES.SET_SIDEBAR_OPEN,
        payload: isOpen,
      });
    } catch (error) {
      logger.error(COMPONENT_NAME, "Error setting sidebar state", {
        error: error.message,
        isOpen,
      });
    }
  }, []);

  const setLoading = useCallback((loading) => {
    dispatch({
      type: ACTION_TYPES.SET_LOADING,
      payload: !!loading,
    });
  }, []);

  const setTheme = useCallback((theme) => {
    try {
      const validThemes = ["dark", "light"];
      if (!validThemes.includes(theme)) {
        throw new Error(
          `Invalid theme: ${theme}. Valid themes are: ${validThemes.join(", ")}`
        );
      }

      dispatch({
        type: ACTION_TYPES.SET_THEME,
        payload: theme,
      });
    } catch (error) {
      logger.error(COMPONENT_NAME, "Error setting theme", {
        error: error.message,
        theme,
      });
    }
  }, []);

  const setError = useCallback((error) => {
    dispatch({
      type: ACTION_TYPES.SET_ERROR,
      payload: error,
    });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: ACTION_TYPES.CLEAR_ERROR });
  }, []);

  const updateUserPreferences = useCallback(
    (preferences) => {
      try {
        const updatedPreferences = {
          ...state.userPreferences,
          ...preferences,
        };

        dispatch({
          type: ACTION_TYPES.SET_USER_PREFERENCES,
          payload: updatedPreferences,
        });

        // Persist to localStorage
        setPersistedPreferences(updatedPreferences);
      } catch (error) {
        logger.error(COMPONENT_NAME, "Error updating user preferences", {
          error: error.message,
          preferences,
        });
      }
    },
    [state.userPreferences, setPersistedPreferences]
  );

  // Memoized context value for performance
  const contextValue = useMemo(
    () => ({
      // State
      ...state,

      // Actions
      setActiveSection,
      toggleSidebar,
      setSidebarOpen,
      setLoading,
      setTheme,
      setError,
      clearError,
      updateUserPreferences,

      // Utilities
      isDebugMode: state.userPreferences.debugMode,
    }),
    [
      state,
      setActiveSection,
      toggleSidebar,
      setSidebarOpen,
      setLoading,
      setTheme,
      setError,
      clearError,
      updateUserPreferences,
    ]
  );

  // Development debugging
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      window.__APP_STATE__ = state;
      window.__APP_ACTIONS__ = {
        setActiveSection,
        toggleSidebar,
        setSidebarOpen,
        setLoading,
        setTheme,
        updateUserPreferences,
      };
    }
  }, [
    state,
    setActiveSection,
    toggleSidebar,
    setSidebarOpen,
    setLoading,
    setTheme,
    updateUserPreferences,
  ]);

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
};

/**
 * Enhanced custom hook to use the app context
 * @returns {AppContextValue} App context value
 * @throws {Error} If used outside of AppProvider
 */
export const useApp = () => {
  const context = useContext(AppContext);

  if (!context) {
    const error = new Error("useApp must be used within an AppProvider");
    logger.error(COMPONENT_NAME, "Context used outside provider", {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }

  return context;
};

export default AppContext;
