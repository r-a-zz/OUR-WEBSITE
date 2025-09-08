// Application Constants and Configuration

export const APP_CONFIG = {
  name: "Our Amazing Website",
  description:
    "Experience the future of web design with stunning visuals and seamless interactions",
  version: "1.0.0",
  author: "Our Amazing Team",
  url: "https://ourwebsite.com",
  email: "hello@ourwebsite.com",
  phone: "+1 (555) 123-4567",
  address: {
    street: "123 Design Street",
    city: "San Francisco",
    state: "CA",
    zip: "94110",
  },
};

export const ANIMATION_CONFIG = {
  pageTransition: {
    type: "tween",
    ease: "anticipate",
    duration: 0.5,
  },
  defaultSpring: {
    type: "spring",
    stiffness: 300,
    damping: 30,
  },
  fastSpring: {
    type: "spring",
    stiffness: 400,
    damping: 10,
  },
  hoverScale: 1.05,
  tapScale: 0.95,
};

export const BREAKPOINTS = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
};

export const COLORS = {
  primary: {
    50: "#eff6ff",
    100: "#dbeafe",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
  },
  secondary: {
    50: "#faf5ff",
    100: "#f3e8ff",
    500: "#8b5cf6",
    600: "#7c3aed",
    700: "#6d28d9",
  },
};

export const SOCIAL_LINKS = {
  twitter: "https://twitter.com/ourwebsite",
  linkedin: "https://linkedin.com/company/ourwebsite",
  github: "https://github.com/ourwebsite",
  instagram: "https://instagram.com/ourwebsite",
};

export const API_ENDPOINTS = {
  contact: "/api/contact",
  newsletter: "/api/newsletter",
  portfolio: "/api/portfolio",
  blog: "/api/blog",
};

export const SEO_DEFAULTS = {
  title: "Our Amazing Website - Premium Web Development Services",
  description:
    "Experience the future of web design with stunning visuals, seamless interactions, and cutting-edge technology.",
  keywords:
    "web development, modern design, react, user experience, digital solutions",
  image: "/og-image.jpg",
  type: "website",
};

export const PERFORMANCE_CONFIG = {
  enablePerformanceMonitoring: process.env.NODE_ENV === "development",
  enableErrorReporting: process.env.NODE_ENV === "production",
  enableAnalytics: process.env.NODE_ENV === "production",
};

export const ACCESSIBILITY_CONFIG = {
  respectReducedMotion: true,
  defaultFocusOutline: "2px solid rgba(59, 130, 246, 0.8)",
  skipLinkTarget: "#main-content",
};

export const THEME_CONFIG = {
  defaultTheme: "dark",
  supportedThemes: ["light", "dark"],
  enableSystemTheme: true,
};
