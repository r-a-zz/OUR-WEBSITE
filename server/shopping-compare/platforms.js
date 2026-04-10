const PLATFORM_CONFIGS = {
  amazon: {
    id: "amazon",
    name: "Amazon",
    domains: ["amazon.in", "www.amazon.in"],
    searchDomain: "amazon.in",
  },
  flipkart: {
    id: "flipkart",
    name: "Flipkart",
    domains: ["flipkart.com", "www.flipkart.com"],
    searchDomain: "flipkart.com",
  },
  myntra: {
    id: "myntra",
    name: "Myntra",
    domains: ["myntra.com", "www.myntra.com"],
    searchDomain: "myntra.com",
  },
  ajio: {
    id: "ajio",
    name: "Ajio",
    domains: ["ajio.com", "www.ajio.com"],
    searchDomain: "ajio.com",
  },
  croma: {
    id: "croma",
    name: "Croma",
    domains: ["croma.com", "www.croma.com"],
    searchDomain: "croma.com",
  },
  reliancedigital: {
    id: "reliancedigital",
    name: "Reliance Digital",
    domains: ["reliancedigital.in", "www.reliancedigital.in"],
    searchDomain: "reliancedigital.in",
  },
};

const DEFAULT_PLATFORM_IDS = ["amazon", "flipkart", "myntra", "ajio"];

const normalizePlatformId = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z]/g, "");

const getPlatformConfig = (platformId) => {
  const normalizedId = normalizePlatformId(platformId);
  return PLATFORM_CONFIGS[normalizedId] || null;
};

const getSupportedPlatforms = () =>
  Object.values(PLATFORM_CONFIGS).map((platform) => ({
    id: platform.id,
    name: platform.name,
  }));

const resolvePlatformIds = (requestedPlatforms) => {
  if (!Array.isArray(requestedPlatforms) || requestedPlatforms.length === 0) {
    return DEFAULT_PLATFORM_IDS;
  }

  const resolved = requestedPlatforms
    .map((platformId) => normalizePlatformId(platformId))
    .filter((platformId) => Boolean(PLATFORM_CONFIGS[platformId]));

  return resolved.length > 0
    ? Array.from(new Set(resolved))
    : DEFAULT_PLATFORM_IDS;
};

const detectPlatformIdFromUrl = (inputUrl) => {
  try {
    const url = new URL(inputUrl);
    const hostname = url.hostname.toLowerCase();

    for (const [platformId, platform] of Object.entries(PLATFORM_CONFIGS)) {
      if (platform.domains.some((domain) => hostname === domain)) {
        return platformId;
      }
    }

    return null;
  } catch {
    return null;
  }
};

module.exports = {
  PLATFORM_CONFIGS,
  DEFAULT_PLATFORM_IDS,
  getPlatformConfig,
  getSupportedPlatforms,
  resolvePlatformIds,
  detectPlatformIdFromUrl,
};
