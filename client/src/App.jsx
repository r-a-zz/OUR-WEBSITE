import React, { Suspense, lazy, useMemo } from "react";
import {
  motion as Motion,
  AnimatePresence,
  MotionConfig,
  useReducedMotion,
} from "framer-motion";
import {
  Home,
  Info,
  Layers,
  Briefcase,
  FileText,
  CalendarDays,
  ShoppingBag,
} from "lucide-react";

// Context and Hooks
import { AppProvider, useApp } from "./context/AppContext";
import { useMediaQuery, useKeyPress } from "./hooks";

// Components
import Header from "./components/Layout/Header";
import Sidebar from "./components/Layout/Sidebar";
import CosmosBackground from "./components/Background/CosmosBackground";
import ScrollToTop from "./components/UI/ScrollToTop";
import CosmicLoadingSpinner from "./components/UI/CosmicLoadingSpinner";
import SEO from "./components/SEO";

// Lazy load pages for better performance
const loadHomePage = () => import("./components/Pages/HomePage");
const loadDailyHubPage = () => import("./components/Pages/DailyHubPage");
const loadShoppingComparePage = () =>
  import("./components/Pages/ShoppingComparePage");
const loadAboutPage = () => import("./components/Pages/AboutPage");
const loadServicesPage = () => import("./components/Pages/ServicesPage");
const loadPortfolioPage = () => import("./components/Pages/PortfolioPage");
const loadLoveNotesPage = () => import("./components/Pages/LoveNotesPage");

const HomePage = lazy(loadHomePage);
const DailyHubPage = lazy(loadDailyHubPage);
const ShoppingComparePage = lazy(loadShoppingComparePage);
const AboutPage = lazy(loadAboutPage);
const ServicesPage = lazy(loadServicesPage);
const PortfolioPage = lazy(loadPortfolioPage);
const LoveNotesPage = lazy(loadLoveNotesPage);

const PAGE_PRELOADERS = [
  loadHomePage,
  loadDailyHubPage,
  loadShoppingComparePage,
  loadAboutPage,
  loadServicesPage,
  loadPortfolioPage,
  loadLoveNotesPage,
];

const NAV_ITEMS = [
  {
    id: "home",
    label: "Home",
    description: "Our highlights and love counter",
    icon: Home,
  },
  {
    id: "daily",
    label: "Daily Hub",
    description: "Todo, calendar, and daily thought",
    icon: CalendarDays,
    badge: "NEW",
  },
  {
    id: "shopping",
    label: "Shopping Compare",
    description: "Typo-tolerant search with filters and price range",
    icon: ShoppingBag,
  },
  {
    id: "services",
    label: "Dreams & Tools",
    description: "Fun websites and useful discoveries",
    icon: Layers,
  },
  {
    id: "blog",
    label: "Love Notes",
    description: "Journal and private memories",
    icon: FileText,
  },
  {
    id: "portfolio",
    label: "Memories",
    description: "Our moments and snapshots",
    icon: Briefcase,
  },
  {
    id: "about",
    label: "About Us",
    description: "Our story and journey",
    icon: Info,
  },
];

const SEO_DATA = {
  home: {
    title: "Our Amazing Website - Premium Web Development Services",
    description:
      "Experience the future of web design with stunning visuals, seamless interactions, and cutting-edge technology.",
    keywords:
      "web development, modern design, react, user experience, digital solutions",
  },
  daily: {
    title: "Daily Hub - Everyday Planner, Shopping Helper, and Inspiration",
    description:
      "A personalized daily space with todo list, calendar, thought of the day, and smart shopping comparison links.",
    keywords:
      "daily planner, to do list, calendar, shopping comparison, pinterest links, thought of the day",
  },
  shopping: {
    title: "Shopping Compare - Smart Product Search and Price Filters",
    description:
      "Compare products with typo-tolerant search, price ranges, category and brand filters, and marketplace links.",
    keywords:
      "shopping compare, product search, price comparison, typo tolerant search, ecommerce filters",
  },
  about: {
    title: "About Us - Our Amazing Website",
    description:
      "Learn about our passionate team dedicated to creating exceptional digital experiences and pushing web boundaries.",
    keywords: "team, experience, web development, digital agency, innovation",
  },
  services: {
    title: "Our Services - Web Development & Design",
    description:
      "Comprehensive digital solutions including web development, UI/UX design, mobile apps, and technology consulting.",
    keywords:
      "web development, UI UX design, mobile apps, consulting, digital services",
  },
  portfolio: {
    title: "Portfolio - Our Work & Projects",
    description:
      "Explore our collection of successful projects showcasing expertise in creating innovative digital solutions.",
    keywords: "portfolio, projects, web development, case studies, client work",
  },
  blog: {
    title: "Love Notes - Our Digital Diary",
    description:
      "Our private collection of love notes, memories, and precious moments shared together in our digital diary.",
    keywords:
      "love notes, diary, memories, relationship, digital journal, love story",
  },
};

const PAGE_COMPONENTS = {
  home: HomePage,
  daily: DailyHubPage,
  shopping: ShoppingComparePage,
  about: AboutPage,
  services: ServicesPage,
  portfolio: PortfolioPage,
  blog: LoveNotesPage,
};

const PAGE_VARIANTS = {
  initial: { opacity: 0, y: 10 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -10 },
};

const PAGE_TRANSITION = {
  type: "tween",
  ease: "easeInOut",
  duration: 0.2,
};

const REDUCED_PAGE_VARIANTS = {
  initial: { opacity: 0 },
  in: { opacity: 1 },
  out: { opacity: 0 },
};

const REDUCED_PAGE_TRANSITION = {
  type: "tween",
  ease: "linear",
  duration: 0.12,
};

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <CosmicLoadingSpinner size={60} />
  </div>
);

// Main App Content Component
const AppContent = () => {
  const {
    activeSection,
    sidebarOpen,
    toggleSidebar,
    setActiveSection,
    setSidebarOpen,
  } = useApp();
  const isMobile = useMediaQuery("(max-width: 768px)"); // Use same breakpoint as constants
  const escapePressed = useKeyPress("Escape");
  const prefersReducedMotion = useReducedMotion();

  const ActivePage = useMemo(
    () => PAGE_COMPONENTS[activeSection] || HomePage,
    [activeSection],
  );

  const currentSEO = useMemo(
    () => SEO_DATA[activeSection] || SEO_DATA.home,
    [activeSection],
  );

  const currentSectionLabel = useMemo(() => {
    const activeItem = NAV_ITEMS.find((item) => item.id === activeSection);
    return activeItem?.label || "Home";
  }, [activeSection]);

  const pageVariants = useMemo(
    () => (prefersReducedMotion ? REDUCED_PAGE_VARIANTS : PAGE_VARIANTS),
    [prefersReducedMotion],
  );

  const pageTransition = useMemo(
    () => (prefersReducedMotion ? REDUCED_PAGE_TRANSITION : PAGE_TRANSITION),
    [prefersReducedMotion],
  );

  const handleMainContentClick = React.useCallback(() => {
    // Close sidebar when clicking on main content on mobile.
    if (sidebarOpen && isMobile) {
      setSidebarOpen(false);
    }
  }, [sidebarOpen, isMobile, setSidebarOpen]);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const preloadPages = () => {
      PAGE_PRELOADERS.forEach((loader) => {
        void loader();
      });
    };

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(preloadPages, {
        timeout: 1200,
      });
      return () => {
        window.cancelIdleCallback(idleId);
      };
    }

    const timeoutId = window.setTimeout(preloadPages, 600);
    return () => window.clearTimeout(timeoutId);
  }, []);

  // Close sidebar on escape key press
  React.useEffect(() => {
    if (escapePressed && sidebarOpen) {
      setSidebarOpen(false);
    }
  }, [escapePressed, sidebarOpen, setSidebarOpen]);

  // Close sidebar on mobile when route changes
  React.useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [activeSection, isMobile, setSidebarOpen]);

  return (
    <MotionConfig reducedMotion={prefersReducedMotion ? "always" : "never"}>
      <div
        className="min-h-screen bg-black relative overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse at center, #0a0a0a 0%, #000000 40%, #000000 100%)",
        }}
      >
        {/* SEO Component */}
        <SEO {...currentSEO} />

        {/* Enhanced cosmic background */}
        <CosmosBackground />

        {/* Navigation Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={toggleSidebar}
          navItems={NAV_ITEMS}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />

        {/* Main content area */}
        <Motion.div
          className={`transition-all duration-200 ${
            sidebarOpen ? "lg:ml-64 xl:ml-72" : "ml-0"
          }`}
          style={{ willChange: "margin-left" }}
          onClick={handleMainContentClick}
        >
          {/* Header */}
          <Header
            onToggleSidebar={toggleSidebar}
            currentSection={activeSection}
            currentSectionLabel={currentSectionLabel}
            isSidebarOpen={sidebarOpen}
          />

          {/* Page content with animations */}
          <main className="p-4 sm:p-6 lg:p-8 xl:p-12 min-h-screen flex items-center justify-center relative z-10">
            <div className="w-full max-w-7xl">
              <Suspense fallback={<PageLoader />}>
                <AnimatePresence mode={prefersReducedMotion ? "sync" : "wait"}>
                  <Motion.div
                    key={activeSection}
                    initial={prefersReducedMotion ? false : "initial"}
                    animate="in"
                    exit="out"
                    variants={pageVariants}
                    transition={pageTransition}
                  >
                    <ActivePage />
                  </Motion.div>
                </AnimatePresence>
              </Suspense>
            </div>
          </main>
        </Motion.div>

        {/* Scroll to top button */}
        <ScrollToTop />

        {/* Performance monitor in development */}
        {import.meta.env.DEV && (
          <div className="fixed bottom-4 left-4 bg-black/50 text-white text-xs p-2 rounded">
            Active: {activeSection} | Mobile: {isMobile ? "Yes" : "No"}
          </div>
        )}
      </div>
    </MotionConfig>
  );
};

// Wrap the app with providers
const App = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
