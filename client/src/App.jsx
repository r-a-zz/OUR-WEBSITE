import React, { Suspense, lazy } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Info, Layers, Briefcase, FileText, Mail } from "lucide-react";

// Context and Hooks
import { AppProvider, useApp } from "./context/AppContext";
import { useMediaQuery, useKeyPress } from "./hooks";

// Components
import Header from "./components/Layout/Header";
import Sidebar from "./components/Layout/Sidebar";
import CosmosBackground from "./components/Background/CosmosBackground";
import ScrollToTop from "./components/UI/ScrollToTop";
import LoadingSpinner from "./components/UI/LoadingSpinner";
import CosmicLoadingSpinner from "./components/UI/CosmicLoadingSpinner";
import SEO from "./components/SEO";

// Lazy load pages for better performance
const HomePage = lazy(() => import("./components/Pages/HomePage"));
const AboutPage = lazy(() => import("./components/Pages/AboutPage"));
const ServicesPage = lazy(() => import("./components/Pages/ServicesPage"));
const PortfolioPage = lazy(() => import("./components/Pages/PortfolioPage"));
const BlogPage = lazy(() => import("./components/Pages/BlogPage"));
const ContactPage = lazy(() => import("./components/Pages/ContactPage"));

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

  console.log("App state:", { activeSection, sidebarOpen }); // Debug log
  const isMobile = useMediaQuery("(max-width: 768px)"); // Use same breakpoint as constants
  const escapePressed = useKeyPress("Escape");

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

  // Memoized nav items to prevent re-creation
  const navItems = React.useMemo(
    () => [
      { id: "home", label: "♡ Our Love", icon: Home },
      { id: "about", label: "♡ About Us", icon: Info },
      { id: "services", label: "♡ Our Dreams", icon: Layers },
      { id: "portfolio", label: "♡ Memories", icon: Briefcase },
      { id: "blog", label: "♡ Love Notes", icon: FileText },
      { id: "contact", label: "♡ Forever", icon: Mail },
    ],
    []
  );

  // SEO data for different sections
  const seoData = {
    home: {
      title: "Our Amazing Website - Premium Web Development Services",
      description:
        "Experience the future of web design with stunning visuals, seamless interactions, and cutting-edge technology.",
      keywords:
        "web development, modern design, react, user experience, digital solutions",
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
      keywords:
        "portfolio, projects, web development, case studies, client work",
    },
    blog: {
      title: "Blog - Web Development Insights & Tutorials",
      description:
        "Stay updated with the latest web development trends, tutorials, and industry insights from our expert team.",
      keywords: "blog, web development, tutorials, trends, technology news",
    },
    contact: {
      title: "Contact Us - Get In Touch",
      description:
        "Ready to start your project? Contact our team for professional web development and design services.",
      keywords:
        "contact, get in touch, web development services, consultation, hire developers",
    },
  };

  const renderContent = () => {
    const pageVariants = {
      initial: { opacity: 0, y: 10 },
      in: { opacity: 1, y: 0 },
      out: { opacity: 0, y: -10 },
    };

    const pageTransition = {
      type: "tween",
      ease: "easeInOut",
      duration: 0.2,
    };

    const pages = {
      home: <HomePage />,
      about: <AboutPage />,
      services: <ServicesPage />,
      portfolio: <PortfolioPage />,
      blog: <BlogPage />,
      contact: <ContactPage />,
    };

    return (
      <Suspense fallback={<PageLoader />}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
          >
            {pages[activeSection]}
          </motion.div>
        </AnimatePresence>
      </Suspense>
    );
  };

  return (
    <div
      className="min-h-screen bg-black relative overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at center, #0a0a0a 0%, #000000 40%, #000000 100%)",
      }}
    >
      {/* SEO Component */}
      <SEO {...seoData[activeSection]} />

      {/* Enhanced cosmic background */}
      <CosmosBackground />

      {/* Navigation Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
        navItems={navItems}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      {/* Main content area */}
      <motion.div
        className={`transition-all duration-200 ${
          sidebarOpen ? "lg:ml-64 xl:ml-72" : "ml-0"
        }`}
        style={{ willChange: "margin-left" }}
        onClick={() => {
          // Close sidebar when clicking on main content (optional enhancement)
          if (sidebarOpen && isMobile) {
            setSidebarOpen(false);
          }
        }}
      >
        {/* Header */}
        <Header
          onToggleSidebar={toggleSidebar}
          currentSection={activeSection}
          isSidebarOpen={sidebarOpen}
        />

        {/* Page content with animations */}
        <main className="p-4 sm:p-6 lg:p-8 xl:p-12 min-h-screen flex items-center justify-center relative z-10">
          <div className="w-full max-w-7xl">{renderContent()}</div>
        </main>
      </motion.div>

      {/* Scroll to top button */}
      <ScrollToTop />

      {/* Performance monitor in development */}
      {process.env.NODE_ENV === "development" && (
        <div className="fixed bottom-4 left-4 bg-black/50 text-white text-xs p-2 rounded">
          Active: {activeSection} | Mobile: {isMobile ? "Yes" : "No"}
        </div>
      )}
    </div>
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
