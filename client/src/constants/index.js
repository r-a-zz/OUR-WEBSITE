// Application Constants
export const APP_CONFIG = {
  SITE_NAME: "Our Love Universe ♡",
  PROPOSAL_DATE: "2022-11-29T22:06:00",
  LOVE_COUNTER_UPDATE_INTERVAL: 1000,
  ANIMATION_DELAYS: {
    HEADER: 0.2,
    HERO: 0.1,
    FEATURES: 0.8,
    STATS: 1.4,
  },
  RESPONSIVE_BREAKPOINTS: {
    MOBILE: 768,
    TABLET: 1024,
  },
  PERFORMANCE: {
    MOBILE_STAR_COUNT: 25,
    DESKTOP_STAR_COUNT: 50,
    BRIGHT_STAR_COUNT: 8,
    HEART_COUNT_MOBILE: 3,
    HEART_COUNT_DESKTOP: 6,
  },
  LOVE: {
    PARTNER_NAME: "My Beautiful Universe",
    TAGLINE: "Every click brings us closer ♡",
    ANNIVERSARY_DATE: "November 29, 2022",
    RELATIONSHIP_START: "2022-11-29T22:06:00",
  },
  CONTACT: {
    EMAIL: "rajabhishek.id@gmail.com",
    PHONE: "+91-7849019797",
  },
};

export const ROUTES = {
  HOME: { path: "home", name: "♡ Our Love" },
  ABOUT: { path: "about", name: "♡ About Us" },
  LOVE: { path: "love", name: "♡ Love Story" },
  CONTACT: { path: "contact", name: "♡ Forever" },
};

export const LOVE_MESSAGES = {
  ANNIVERSARY_TEXT:
    "✨ From the day you said yes (29th Nov 2022) to forever ✨",
  COUNTER_SUBTITLE:
    "Every second with you feels like forever, yet forever isn't long enough ♡",
  SIDEBAR_QUOTE: '"Every click brings us closer ♡"',
  MADE_WITH_LOVE: "MADE WITH LOVE ♡",
};

export const THEME_COLORS = {
  GRADIENTS: {
    PRIMARY: "linear-gradient(45deg, #06b6d4, #8b5cf6, #7c3aed)",
    LOVE: "linear-gradient(135deg, rgba(34, 211, 238, 0.1) 0%, rgba(168, 85, 247, 0.1) 50%, rgba(124, 58, 237, 0.1) 100%)",
    COSMIC:
      "linear-gradient(180deg, #000000 0%, #0f0f23 25%, #1a1a2e 50%, #16213e 75%, #000000 100%)",
  },
  SHADOWS: {
    COSMIC:
      "0 8px 32px rgba(34, 211, 238, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
    GLOW: "0 0 20px rgba(244, 114, 182, 0.3)",
  },
};
