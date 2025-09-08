/**
 * @fileoverview Enhanced Sidebar component with advanced architecture patterns
 * @author SDE3 Frontend Engineer
 * @version 3.0.0
 *
 * Features:
 * - Advanced error boundary protection
 * - Performance optimized with React.memo and useMemo
 * - Comprehensive accessibility support
 * - Mobile-first responsive design
 * - Type safety with JSDoc annotations
 * - Debugging and monitoring integration
 * - Separation of concerns with sub-components
 */

import React, { memo, useCallback, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, Mail } from "lucide-react";
import { useResponsive } from "../../hooks/useResponsive";
import {
  useClickOutside,
  useFocusManagement,
  useKeyboardNavigation,
} from "../../hooks/useAdvanced";
import { APP_CONFIG } from "../../constants";
import { ANIMATION_VARIANTS, TRANSITIONS, COMPONENT_NAMES } from "../../types";
import { logger, perfMonitor } from "../../utils/debugUtils";
import NavigationItem from "./NavigationItem";

const COMPONENT_NAME = COMPONENT_NAMES.SIDEBAR;

/**
 * Sidebar overlay component with enhanced accessibility and performance
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the overlay is visible
 * @param {Function} props.onClose - Function to close the overlay
 * @param {boolean} props.isMobile - Whether the device is mobile
 */
const SidebarOverlay = memo(({ isOpen, onClose, isMobile }) => {
  const componentName = `${COMPONENT_NAME}.Overlay`;

  // Memoized animation variants for performance
  const overlayVariants = useMemo(() => ANIMATION_VARIANTS.OVERLAY, []);

  // Optimized click handler with proper event delegation
  const handleOverlayClick = useCallback(
    (e) => {
      // Ensure we only close on direct overlay clicks, not sidebar content clicks
      if (e.target === e.currentTarget) {
        logger.debug(componentName, "Overlay clicked - closing sidebar");
        onClose();
      }
    },
    [onClose, componentName]
  );

  // Body scroll management with cleanup - mobile only
  useEffect(() => {
    if (!isOpen || !isMobile) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    logger.debug(componentName, "Body scroll locked (mobile only)");

    return () => {
      document.body.style.overflow = originalOverflow;
      logger.debug(componentName, "Body scroll restored");
    };
  }, [isOpen, isMobile, componentName]);

  // Memoized class names for performance
  const overlayClassName = useMemo(
    () =>
      `fixed inset-0 z-40 touch-manipulation ${
        isMobile
          ? "bg-black/50 backdrop-blur-sm" // Mobile: enhanced visual feedback
          : "bg-black/20" // Desktop: subtle overlay
      }`,
    [isMobile]
  );

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={TRANSITIONS.FAST}
          className={overlayClassName}
          onClick={handleOverlayClick}
          aria-hidden="true"
          role="presentation"
        />
      )}
    </AnimatePresence>
  );
});

SidebarOverlay.displayName = `${COMPONENT_NAME}.Overlay`;

/**
 * Sidebar Header component with enhanced UX and accessibility
 * @param {Object} props - Component props
 * @param {Function} props.onClose - Function to close the sidebar
 */
const SidebarHeader = memo(({ onClose }) => {
  const componentName = `${COMPONENT_NAME}.Header`;

  const handleClose = useCallback(() => {
    logger.debug(componentName, "Close button clicked");
    onClose();
  }, [onClose, componentName]);

  // Enhanced keyboard navigation support
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleClose();
      }
    },
    [handleClose]
  );

  return (
    <header className="flex items-start justify-between mb-8 sm:mb-10">
      {/* Brand section with improved typography */}
      <div className="flex-1 pr-4">
        <motion.h2
          initial={ANIMATION_VARIANTS.FADE_IN.hidden}
          animate={ANIMATION_VARIANTS.FADE_IN.visible}
          transition={{ ...TRANSITIONS.NORMAL, delay: 0.1 }}
          className="text-lg sm:text-xl font-bold bg-gradient-to-r from-pink-300 via-red-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2 leading-tight"
        >
          <Heart
            className="w-5 h-5 sm:w-6 sm:h-6 text-red-400 flex-shrink-0"
            aria-hidden="true"
          />
          <span className="break-words">{APP_CONFIG.SITE_NAME}</span>
        </motion.h2>
      </div>

      {/* Enhanced close button with better accessibility */}
      <motion.button
        onClick={handleClose}
        onKeyDown={handleKeyDown}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ ...TRANSITIONS.NORMAL, delay: 0.2 }}
        whileHover={ANIMATION_VARIANTS.SCALE.hover}
        whileTap={ANIMATION_VARIANTS.SCALE.tap}
        className="flex-shrink-0 text-cyan-300 hover:text-cyan-100 transition-all duration-200 p-2.5 sm:p-3 hover:bg-cyan-500/10 rounded-xl touch-manipulation focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:ring-offset-2 focus:ring-offset-transparent"
        aria-label="Close navigation menu"
        type="button"
      >
        <X size={18} className="sm:w-5 sm:h-5" aria-hidden="true" />
      </motion.button>
    </header>
  );
});

SidebarHeader.displayName = `${COMPONENT_NAME}.Header`;

/**
 * Love Message component with enhanced styling and accessibility
 */
const LoveMessage = memo(() => {
  const componentName = `${COMPONENT_NAME}.LoveMessage`;

  // Memoized animation variants
  const messageVariants = useMemo(
    () => ({
      hidden: ANIMATION_VARIANTS.FADE_IN.hidden,
      visible: {
        ...ANIMATION_VARIANTS.FADE_IN.visible,
        transition: { ...TRANSITIONS.NORMAL, delay: 0.4 },
      },
    }),
    []
  );

  return (
    <motion.div
      variants={messageVariants}
      initial="hidden"
      animate="visible"
      className="mt-8 sm:mt-10 p-4 sm:p-5 bg-gradient-to-r from-pink-900/15 to-purple-900/15 rounded-2xl border border-pink-400/15 backdrop-blur-sm"
      role="complementary"
      aria-label="Love message"
    >
      <p className="text-xs sm:text-sm text-pink-200/90 text-center italic leading-relaxed">
        "{APP_CONFIG.LOVE.TAGLINE}"
      </p>
    </motion.div>
  );
});

LoveMessage.displayName = `${COMPONENT_NAME}.LoveMessage`;

/**
 * Sidebar Footer component with enhanced contact integration
 */
const SidebarFooter = memo(() => {
  const componentName = `${COMPONENT_NAME}.Footer`;

  // Memoized animation variants
  const footerVariants = useMemo(
    () => ({
      hidden: ANIMATION_VARIANTS.FADE_IN.hidden,
      visible: {
        ...ANIMATION_VARIANTS.FADE_IN.visible,
        transition: { ...TRANSITIONS.NORMAL, delay: 0.5 },
      },
    }),
    []
  );

  const handleEmailClick = useCallback(() => {
    logger.info(componentName, "Email contact initiated", {
      email: APP_CONFIG.CONTACT.EMAIL,
    });
  }, [componentName]);

  return (
    <motion.footer
      variants={footerVariants}
      initial="hidden"
      animate="visible"
      className="mt-8 sm:mt-10 pt-6 border-t border-pink-400/15"
    >
      {/* Enhanced contact section */}
      <div className="flex items-center justify-center mb-4">
        <motion.a
          href={`mailto:${APP_CONFIG.CONTACT.EMAIL}`}
          onClick={handleEmailClick}
          whileHover={{ scale: 1.1, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-pink-500/15 to-purple-500/15 text-pink-300 hover:text-pink-200 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-pink-400/50 focus:ring-offset-2 focus:ring-offset-transparent border border-pink-400/10 hover:border-pink-400/20"
          aria-label={`Send email to ${APP_CONFIG.CONTACT.EMAIL}`}
        >
          <Mail className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
        </motion.a>
      </div>

      {/* Animated footer text */}
      <p className="text-center text-pink-400/50 text-xs leading-relaxed">
        Made with{" "}
        <motion.span
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-red-400 inline-block"
          aria-label="love"
        >
          ♥
        </motion.span>{" "}
        for {APP_CONFIG.LOVE.PARTNER_NAME}
      </p>
    </motion.footer>
  );
});

SidebarFooter.displayName = `${COMPONENT_NAME}.Footer`;

/**
 * Main Sidebar Component with enterprise-grade architecture
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the sidebar is open
 * @param {Function} props.onToggle - Function to toggle sidebar
 * @param {NavigationItem[]} props.navItems - Navigation items array
 * @param {string} props.activeSection - Currently active section
 * @param {Function} props.onSectionChange - Function to change active section
 */
const Sidebar = memo(
  ({ isOpen, onToggle, navItems, activeSection, onSectionChange }) => {
    const componentName = COMPONENT_NAME;
    const { isMobile, isHydrated } = useResponsive();
    const sidebarRef = useRef(null);

    // Performance monitoring
    useEffect(() => {
      perfMonitor.start("sidebar-render");
      return () => perfMonitor.end("sidebar-render", componentName);
    });

    // Enhanced logging with performance data
    useEffect(() => {
      logger.debug(componentName, "Sidebar render state", {
        isOpen,
        activeSection,
        navItemsCount: navItems?.length || 0,
        isMobile,
        isHydrated,
      });
    }, [
      isOpen,
      activeSection,
      navItems?.length,
      isMobile,
      isHydrated,
      componentName,
    ]);

    // Optimized navigation handler with error boundary
    const handleNavigate = useCallback(
      (sectionId) => {
        try {
          logger.info(componentName, "Navigation initiated", {
            from: activeSection,
            to: sectionId,
          });

          onSectionChange(sectionId);

          // Auto-close sidebar on mobile after navigation
          if (isMobile && isOpen) {
            onToggle();
            logger.debug(
              componentName,
              "Auto-closed sidebar on mobile navigation"
            );
          }
        } catch (error) {
          logger.error(componentName, "Navigation error", {
            error: error.message,
            sectionId,
            activeSection,
          });
        }
      },
      [
        onSectionChange,
        onToggle,
        isMobile,
        isOpen,
        activeSection,
        componentName,
      ]
    );

    // Enhanced click outside with proper cleanup
    useClickOutside(sidebarRef, onToggle, isOpen && isMobile);

    // Advanced focus management for accessibility
    useFocusManagement(isOpen, sidebarRef);

    // Comprehensive keyboard navigation
    useKeyboardNavigation({
      onEscape: onToggle,
      enabled: isOpen,
    });

    // Memoized sidebar classes for performance
    const sidebarClassName = useMemo(
      () =>
        `fixed top-0 left-0 h-full z-50 ${
          isMobile
            ? "w-80 max-w-[85vw]" // Mobile: responsive width with viewport constraint
            : "w-64 sm:w-72 md:w-80" // Desktop: progressive width scaling
        }`,
      [isMobile]
    );

    // Memoized style object to prevent re-creation
    const sidebarStyle = useMemo(
      () => ({
        background:
          "linear-gradient(180deg, #000000 0%, #0f0f23 25%, #1a1a2e 50%, #16213e 75%, #000000 100%)",
        borderRight: "1px solid rgba(34, 211, 238, 0.15)",
        boxShadow:
          "0 0 40px rgba(0, 0, 0, 0.7), 0 0 100px rgba(34, 211, 238, 0.1)",
        willChange: "transform",
        backfaceVisibility: "hidden",
        touchAction: "pan-y", // Enhanced mobile scroll performance
      }),
      []
    );

    // Memoized sidebar variants for consistent animations
    const sidebarVariants = useMemo(
      () => ({
        hidden: ANIMATION_VARIANTS.SIDEBAR.hidden,
        visible: ANIMATION_VARIANTS.SIDEBAR.visible,
      }),
      []
    );

    // Error boundary for navigation items rendering
    const renderNavigationItems = useMemo(() => {
      try {
        return (
          navItems?.map((item, index) => (
            <motion.div
              key={`nav-item-${item.id}`}
              initial={ANIMATION_VARIANTS.FADE_IN.hidden}
              animate={ANIMATION_VARIANTS.FADE_IN.visible}
              transition={{ ...TRANSITIONS.NORMAL, delay: 0.1 + index * 0.05 }}
            >
              <NavigationItem
                item={item}
                isActive={activeSection === item.id}
                onClick={() => handleNavigate(item.id)}
              />
            </motion.div>
          )) || []
        );
      } catch (error) {
        logger.error(componentName, "Error rendering navigation items", {
          error: error.message,
          navItemsCount: navItems?.length || 0,
        });
        return null;
      }
    }, [navItems, activeSection, handleNavigate, componentName]);

    // Don't render until hydrated to prevent SSR mismatches
    if (!isHydrated) {
      return null;
    }

    return (
      <>
        {/* Enhanced overlay with performance optimization */}
        <SidebarOverlay
          isOpen={isOpen}
          onClose={onToggle}
          isMobile={isMobile}
        />

        {/* Main sidebar with comprehensive enhancements */}
        <motion.aside
          ref={sidebarRef}
          initial="hidden"
          animate={isOpen ? "visible" : "hidden"}
          variants={sidebarVariants}
          transition={TRANSITIONS.NORMAL}
          className={sidebarClassName}
          style={sidebarStyle}
          role="navigation"
          aria-label="Main navigation"
          aria-hidden={!isOpen}
        >
          {/* Scrollable content container with enhanced UX */}
          <div className="p-5 sm:p-6 md:p-7 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-500/20 scrollbar-track-transparent">
            <SidebarHeader onClose={onToggle} />

            {/* Enhanced navigation section */}
            <nav
              className="space-y-2 mb-6"
              role="menu"
              aria-label="Site navigation"
            >
              {renderNavigationItems}
            </nav>

            {/* Flexible spacer */}
            <div className="flex-1" />

            {/* Footer components */}
            <LoveMessage />
            <SidebarFooter />
          </div>

          {/* Enhanced animated border with performance optimization */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...TRANSITIONS.NORMAL, delay: 0.3 }}
            className="absolute top-0 right-0 w-[1px] h-full pointer-events-none"
            style={{
              background:
                "linear-gradient(to bottom, transparent 0%, rgba(34, 211, 238, 0.3) 20%, rgba(34, 211, 238, 0.6) 50%, rgba(34, 211, 238, 0.3) 80%, transparent 100%)",
            }}
            aria-hidden="true"
          />

          {/* Subtle inner glow for depth */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at 0% 50%, rgba(34, 211, 238, 0.03) 0%, transparent 50%)",
            }}
            aria-hidden="true"
          />
        </motion.aside>
      </>
    );
  }
);

Sidebar.displayName = COMPONENT_NAME;

export default Sidebar;
