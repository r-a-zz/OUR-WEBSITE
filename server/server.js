const express = require("express");
const cors = require("cors");
const compression = require("compression");
const axios = require("axios");
const Redis = require("ioredis");
const rateLimit = require("express-rate-limit");
const promClient = require("prom-client");
const {
  compareProducts,
  getSupportedPlatforms: getCompareSupportedPlatforms,
} = require("./shopping-compare/compareService");
require("dotenv").config();

const app = express();

const parseBooleanFlag = (value, defaultValue = false) => {
  if (value === undefined || value === null || String(value).trim() === "") {
    return defaultValue;
  }

  return ["1", "true", "yes", "on"].includes(
    String(value).trim().toLowerCase(),
  );
};

const PORT = Number.parseInt(process.env.PORT || "5000", 10);
const YOUTUBE_API_KEY = (process.env.YOUTUBE_API_KEY || "").trim();
const YOUTUBE_API_BASE_URL = "https://www.googleapis.com/youtube/v3";
const REQUEST_TIMEOUT_MS = Number.parseInt(
  process.env.YOUTUBE_API_TIMEOUT_MS || "10000",
  10,
);
const CORS_ORIGIN = (process.env.CORS_ORIGIN || "*").trim();
const CACHE_MAX_ENTRIES = Number.parseInt(
  process.env.API_CACHE_MAX_ENTRIES || "250",
  10,
);
const SEARCH_CACHE_TTL_MS = Number.parseInt(
  process.env.API_CACHE_SEARCH_TTL_MS || "120000",
  10,
);
const VIDEO_CACHE_TTL_MS = Number.parseInt(
  process.env.API_CACHE_VIDEO_TTL_MS || "600000",
  10,
);
const TRENDING_CACHE_TTL_MS = Number.parseInt(
  process.env.API_CACHE_TRENDING_TTL_MS || "180000",
  10,
);
const SHOPPING_CACHE_TTL_MS = Number.parseInt(
  process.env.API_CACHE_SHOPPING_TTL_MS || "180000",
  10,
);
const REDIS_URL = (process.env.REDIS_URL || "").trim();
const REDIS_USERNAME = (process.env.REDIS_USERNAME || "").trim();
const REDIS_PASSWORD = (process.env.REDIS_PASSWORD || "").trim();
const REDIS_TLS_ENABLED = parseBooleanFlag(
  process.env.REDIS_TLS_ENABLED,
  false,
);
const REDIS_TLS_REJECT_UNAUTHORIZED = parseBooleanFlag(
  process.env.REDIS_TLS_REJECT_UNAUTHORIZED,
  true,
);
const REDIS_CONNECT_TIMEOUT_MS = Number.parseInt(
  process.env.REDIS_CONNECT_TIMEOUT_MS || "1500",
  10,
);
const REDIS_RETRY_BASE_DELAY_MS = Number.parseInt(
  process.env.REDIS_RETRY_BASE_DELAY_MS || "150",
  10,
);
const REDIS_RETRY_MAX_DELAY_MS = Number.parseInt(
  process.env.REDIS_RETRY_MAX_DELAY_MS || "2000",
  10,
);
const REDIS_KEY_PREFIX = (process.env.REDIS_KEY_PREFIX || "ourwebsite:").trim();
const API_RATE_LIMIT_WINDOW_MS = Number.parseInt(
  process.env.API_RATE_LIMIT_WINDOW_MS || "60000",
  10,
);
const API_RATE_LIMIT_MAX_REQUESTS = Number.parseInt(
  process.env.API_RATE_LIMIT_MAX_REQUESTS || "120",
  10,
);
const API_RATE_LIMIT_SEARCH_MAX_REQUESTS = Number.parseInt(
  process.env.API_RATE_LIMIT_SEARCH_MAX_REQUESTS || "60",
  10,
);
const API_RATE_LIMIT_VIDEO_MAX_REQUESTS = Number.parseInt(
  process.env.API_RATE_LIMIT_VIDEO_MAX_REQUESTS || "90",
  10,
);
const API_RATE_LIMIT_TRENDING_MAX_REQUESTS = Number.parseInt(
  process.env.API_RATE_LIMIT_TRENDING_MAX_REQUESTS || "60",
  10,
);
const API_RATE_LIMIT_SHOPPING_MAX_REQUESTS = Number.parseInt(
  process.env.API_RATE_LIMIT_SHOPPING_MAX_REQUESTS || "60",
  10,
);
const API_RATE_LIMIT_METRICS_MAX_REQUESTS = Number.parseInt(
  process.env.API_RATE_LIMIT_METRICS_MAX_REQUESTS || "30",
  10,
);
const METRICS_ENABLED = parseBooleanFlag(process.env.METRICS_ENABLED, true);

const resolveCorsOrigin = () => {
  if (!CORS_ORIGIN || CORS_ORIGIN === "*") {
    return true;
  }

  return CORS_ORIGIN.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const corsOptions = {
  origin: resolveCorsOrigin(),
  methods: ["GET", "POST", "OPTIONS"],
};

app.use(cors(corsOptions));
app.use(compression());
app.use(express.json());

const youtubeClient = axios.create({
  baseURL: YOUTUBE_API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
});

if (!YOUTUBE_API_KEY) {
  console.warn(
    "YOUTUBE_API_KEY is missing. Server is running in demo mode with fallback data.",
  );
}

const clampMaxResults = (value, fallback = 10) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(parsed, 1), 50);
};

const createSuccess = (data, meta = {}) => ({
  success: true,
  data,
  ...meta,
});

const createError = (error, meta = {}) => ({
  success: false,
  error,
  ...meta,
});

const setApiCacheHeaders = (res, ttlMs) => {
  const sharedMaxAge = Math.max(0, Math.floor(ttlMs / 1000));
  const browserMaxAge = Math.min(sharedMaxAge, 30);
  const staleWhileRevalidate = Math.max(60, Math.floor(sharedMaxAge / 2));

  res.set(
    "Cache-Control",
    `public, max-age=${browserMaxAge}, s-maxage=${sharedMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`,
  );
  res.set("Vary", "Accept-Encoding, Origin");
  res.set("X-Cache-Provider", cacheStore.type);
};

const setNoStoreHeaders = (res) => {
  res.set("Cache-Control", "no-store");
};

const normalizeMetricsRoute = (routePath = "") => {
  return routePath.replace(
    /\/api\/youtube\/video\/[^/]+/g,
    "/api/youtube/video/:videoId",
  );
};

const metricsRegistry = new promClient.Registry();
let apiRequestDurationMs = null;
let apiRequestsTotal = null;
let apiCacheEventsTotal = null;

if (METRICS_ENABLED) {
  promClient.collectDefaultMetrics({ register: metricsRegistry });

  apiRequestDurationMs = new promClient.Histogram({
    name: "api_request_duration_ms",
    help: "API request duration in milliseconds",
    labelNames: ["method", "route", "status_code"],
    buckets: [25, 50, 100, 200, 400, 800, 1200, 2000, 5000],
    registers: [metricsRegistry],
  });

  apiRequestsTotal = new promClient.Counter({
    name: "api_requests_total",
    help: "Total number of API requests",
    labelNames: ["method", "route", "status_code"],
    registers: [metricsRegistry],
  });

  apiCacheEventsTotal = new promClient.Counter({
    name: "api_cache_events_total",
    help: "Total cache events by route and result",
    labelNames: ["route", "result", "provider"],
    registers: [metricsRegistry],
  });
}

app.use((req, res, next) => {
  if (!METRICS_ENABLED || !req.path.startsWith("/api")) {
    return next();
  }

  const startTime = process.hrtime.bigint();

  res.on("finish", () => {
    if (!apiRequestDurationMs || !apiRequestsTotal) {
      return;
    }

    const durationMs = Number(process.hrtime.bigint() - startTime) / 1e6;
    const routeLabel = normalizeMetricsRoute(req.path);
    const statusLabel = String(res.statusCode);

    apiRequestDurationMs
      .labels(req.method, routeLabel, statusLabel)
      .observe(durationMs);

    apiRequestsTotal.labels(req.method, routeLabel, statusLabel).inc();
  });

  return next();
});

const createApiRateLimiter = ({
  limit,
  code,
  message,
  windowMs = API_RATE_LIMIT_WINDOW_MS,
  skip,
}) => {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skip,
    handler: (_req, res) => {
      setNoStoreHeaders(res);
      res.status(429).json(
        createError(message || "Too many requests. Please try again shortly.", {
          code: code || "RATE_LIMITED",
        }),
      );
    },
  });
};

const apiGlobalRateLimiter = createApiRateLimiter({
  limit: API_RATE_LIMIT_MAX_REQUESTS,
  code: "API_GLOBAL_RATE_LIMITED",
  skip: (req) =>
    req.path === "/health" || req.path === "/" || req.path === "/metrics",
});

const apiSearchRateLimiter = createApiRateLimiter({
  limit: API_RATE_LIMIT_SEARCH_MAX_REQUESTS,
  code: "API_SEARCH_RATE_LIMITED",
  message: "Search rate limit reached. Please slow down and try again.",
});

const apiVideoRateLimiter = createApiRateLimiter({
  limit: API_RATE_LIMIT_VIDEO_MAX_REQUESTS,
  code: "API_VIDEO_RATE_LIMITED",
  message: "Video requests are limited right now. Please try again shortly.",
});

const apiTrendingRateLimiter = createApiRateLimiter({
  limit: API_RATE_LIMIT_TRENDING_MAX_REQUESTS,
  code: "API_TRENDING_RATE_LIMITED",
  message: "Trending requests are limited right now. Please try again shortly.",
});

const apiShoppingRateLimiter = createApiRateLimiter({
  limit: API_RATE_LIMIT_SHOPPING_MAX_REQUESTS,
  code: "API_SHOPPING_RATE_LIMITED",
  message: "Shopping search is limited right now. Please try again shortly.",
});

const apiMetricsRateLimiter = createApiRateLimiter({
  limit: API_RATE_LIMIT_METRICS_MAX_REQUESTS,
  code: "API_METRICS_RATE_LIMITED",
  message: "Metrics endpoint rate limit reached.",
});

app.use("/api", apiGlobalRateLimiter);
app.use("/api/youtube/search", apiSearchRateLimiter);
app.use("/api/youtube/video", apiVideoRateLimiter);
app.use("/api/youtube/trending", apiTrendingRateLimiter);
app.use("/api/shopping/search", apiShoppingRateLimiter);
app.use("/api/compare", apiShoppingRateLimiter);
app.use("/api/metrics", apiMetricsRateLimiter);

const apiResponseCache = new Map();

const cacheStore = {
  type: "memory",
  redisClient: null,
  redisReady: false,
};

const recordCacheEvent = (route, result) => {
  if (!apiCacheEventsTotal) {
    return;
  }

  apiCacheEventsTotal.labels(route, result, cacheStore.type).inc();
};

let lastRedisWarningAt = 0;

const warnRedisFallback = (message) => {
  const now = Date.now();
  if (now - lastRedisWarningAt < 10000) {
    return;
  }

  lastRedisWarningAt = now;
  console.warn(message);
};

const setupRedisCache = () => {
  if (!REDIS_URL) {
    cacheStore.type = "memory";
    return;
  }

  const redisOptions = {
    lazyConnect: true,
    keyPrefix: REDIS_KEY_PREFIX || undefined,
    maxRetriesPerRequest: 2,
    enableOfflineQueue: false,
    connectTimeout: REDIS_CONNECT_TIMEOUT_MS,
    retryStrategy: (attempt) =>
      Math.min(
        Math.max(REDIS_RETRY_BASE_DELAY_MS, 50) * attempt,
        Math.max(REDIS_RETRY_MAX_DELAY_MS, 200),
      ),
  };

  if (REDIS_USERNAME) {
    redisOptions.username = REDIS_USERNAME;
  }

  if (REDIS_PASSWORD) {
    redisOptions.password = REDIS_PASSWORD;
  }

  if (REDIS_TLS_ENABLED) {
    redisOptions.tls = {
      rejectUnauthorized: REDIS_TLS_REJECT_UNAUTHORIZED,
    };
  }

  const redisClient = new Redis(REDIS_URL, redisOptions);

  redisClient.on("ready", () => {
    cacheStore.redisReady = true;
    cacheStore.type = "redis";
    console.log("Redis cache connected.");
  });

  redisClient.on("end", () => {
    cacheStore.redisReady = false;
    cacheStore.type = "memory";
  });

  redisClient.on("error", (error) => {
    cacheStore.redisReady = false;
    cacheStore.type = "memory";
    warnRedisFallback(
      `Redis cache unavailable. Using in-memory cache. ${error.message}`,
    );
  });

  cacheStore.redisClient = redisClient;

  redisClient.connect().catch((error) => {
    cacheStore.redisReady = false;
    cacheStore.type = "memory";
    warnRedisFallback(
      `Unable to connect to Redis. Falling back to in-memory cache. ${error.message}`,
    );
  });
};

setupRedisCache();

const parseCachedPayload = (rawValue) => {
  try {
    return JSON.parse(rawValue);
  } catch {
    return null;
  }
};

const getCachedResponse = async (cacheKey) => {
  if (cacheStore.redisReady && cacheStore.redisClient) {
    try {
      const rawPayload = await cacheStore.redisClient.get(cacheKey);
      if (!rawPayload) {
        return null;
      }

      return parseCachedPayload(rawPayload);
    } catch {
      // Fall through to in-memory cache when Redis is unavailable.
    }
  }

  const cached = apiResponseCache.get(cacheKey);

  if (!cached) {
    return null;
  }

  if (cached.expiresAt <= Date.now()) {
    apiResponseCache.delete(cacheKey);
    return null;
  }

  return cached.payload;
};

const setCachedResponse = async (cacheKey, payload, ttlMs) => {
  const ttl = Number.isFinite(ttlMs) && ttlMs > 0 ? ttlMs : SEARCH_CACHE_TTL_MS;

  if (cacheStore.redisReady && cacheStore.redisClient) {
    try {
      await cacheStore.redisClient.set(
        cacheKey,
        JSON.stringify(payload),
        "PX",
        ttl,
      );
      return;
    } catch {
      // Fall through to in-memory cache when Redis write fails.
    }
  }

  if (apiResponseCache.size >= CACHE_MAX_ENTRIES) {
    const oldestCacheKey = apiResponseCache.keys().next().value;
    if (oldestCacheKey) {
      apiResponseCache.delete(oldestCacheKey);
    }
  }

  apiResponseCache.set(cacheKey, {
    payload,
    expiresAt: Date.now() + ttl,
  });
};

const parseDuration = (duration) => {
  if (!duration) return "";

  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return "";

  const hours = Number.parseInt(match[1]?.replace("H", "") || "0", 10);
  const minutes = Number.parseInt(match[2]?.replace("M", "") || "0", 10);
  const seconds = Number.parseInt(match[3]?.replace("S", "") || "0", 10);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const formatViewCount = (viewCount) => {
  if (!viewCount) return "0 views";

  const count = Number.parseInt(viewCount, 10);
  if (Number.isNaN(count)) return "0 views";

  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M views`;
  }

  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K views`;
  }

  return `${count} views`;
};

const buildVideoUrl = (videoId) =>
  videoId ? `https://www.youtube.com/watch?v=${videoId}` : null;

const buildEmbedUrl = (videoId) =>
  videoId
    ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`
    : null;

const formatSearchResults = (items = []) => {
  return items.map((item) => {
    const videoId = item.id?.videoId || null;
    const id = videoId || item.id?.channelId || item.id?.playlistId || "";

    return {
      id,
      type: item.id?.kind?.replace("youtube#", "") || "video",
      title: item.snippet?.title || "",
      description: item.snippet?.description || "",
      thumbnail: {
        default: item.snippet?.thumbnails?.default?.url,
        medium: item.snippet?.thumbnails?.medium?.url,
        high: item.snippet?.thumbnails?.high?.url,
        maxres: item.snippet?.thumbnails?.maxres?.url,
      },
      channelTitle: item.snippet?.channelTitle || "",
      channelId: item.snippet?.channelId || "",
      publishedAt: item.snippet?.publishedAt || "",
      url: buildVideoUrl(videoId),
      embedUrl: buildEmbedUrl(videoId),
    };
  });
};

const formatVideoDetails = (item) => {
  const id = item?.id || "";

  return {
    id,
    title: item?.snippet?.title || "",
    description: item?.snippet?.description || "",
    thumbnail: {
      default: item?.snippet?.thumbnails?.default?.url,
      medium: item?.snippet?.thumbnails?.medium?.url,
      high: item?.snippet?.thumbnails?.high?.url,
      maxres: item?.snippet?.thumbnails?.maxres?.url,
    },
    channelTitle: item?.snippet?.channelTitle || "",
    channelId: item?.snippet?.channelId || "",
    publishedAt: item?.snippet?.publishedAt || "",
    duration: item?.contentDetails?.duration,
    viewCount: item?.statistics?.viewCount,
    likeCount: item?.statistics?.likeCount,
    commentCount: item?.statistics?.commentCount,
    url: buildVideoUrl(id),
    embedUrl: buildEmbedUrl(id),
  };
};

const mockYouTubeData = [
  {
    id: "dQw4w9WgXcQ",
    type: "video",
    title: "Rick Astley - Never Gonna Give You Up (Official Video)",
    description:
      "The official video for 'Never Gonna Give You Up' by Rick Astley...",
    thumbnail: {
      default: "https://i.ytimg.com/vi/dQw4w9WgXcQ/default.jpg",
      medium: "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
      high: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    },
    channelTitle: "Rick Astley",
    channelId: "UCuAXFkgsw1L7xaCfnd5JJOw",
    publishedAt: "2009-10-25T06:57:33Z",
    viewCount: "1200000000",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    embedUrl:
      "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0&modestbranding=1",
  },
  {
    id: "9bZkp7q19f0",
    type: "video",
    title: "PSY - GANGNAM STYLE (강남스타일) M/V",
    description: "PSY - GANGNAM STYLE official music video...",
    thumbnail: {
      default: "https://i.ytimg.com/vi/9bZkp7q19f0/default.jpg",
      medium: "https://i.ytimg.com/vi/9bZkp7q19f0/mqdefault.jpg",
      high: "https://i.ytimg.com/vi/9bZkp7q19f0/hqdefault.jpg",
    },
    channelTitle: "officialpsy",
    channelId: "UCrDkAvF9ZkmwbKNlYtQ7cFA",
    publishedAt: "2012-07-15T08:34:21Z",
    viewCount: "5000000000",
    url: "https://www.youtube.com/watch?v=9bZkp7q19f0",
    embedUrl:
      "https://www.youtube.com/embed/9bZkp7q19f0?autoplay=1&rel=0&modestbranding=1",
  },
  {
    id: "kJQP7kiw5Fk",
    type: "video",
    title: "Luis Fonsi - Despacito ft. Daddy Yankee",
    description: "Despacito by Luis Fonsi featuring Daddy Yankee...",
    thumbnail: {
      default: "https://i.ytimg.com/vi/kJQP7kiw5Fk/default.jpg",
      medium: "https://i.ytimg.com/vi/kJQP7kiw5Fk/mqdefault.jpg",
      high: "https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg",
    },
    channelTitle: "LuisFonsiVEVO",
    channelId: "UCJrOtniJ0-NY4bcRiAx0E2A",
    publishedAt: "2017-01-12T18:30:00Z",
    viewCount: "8000000000",
    url: "https://www.youtube.com/watch?v=kJQP7kiw5Fk",
    embedUrl:
      "https://www.youtube.com/embed/kJQP7kiw5Fk?autoplay=1&rel=0&modestbranding=1",
  },
  {
    id: "JGwWNGJdvx8",
    type: "video",
    title: "Ed Sheeran - Shape of You (Official Video)",
    description: "Ed Sheeran's official music video for 'Shape of You'...",
    thumbnail: {
      default: "https://i.ytimg.com/vi/JGwWNGJdvx8/default.jpg",
      medium: "https://i.ytimg.com/vi/JGwWNGJdvx8/mqdefault.jpg",
      high: "https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg",
    },
    channelTitle: "Ed Sheeran",
    channelId: "UC0C-w0YjGpqDXGB8IHb662A",
    publishedAt: "2017-01-30T10:53:17Z",
    viewCount: "6200000000",
    url: "https://www.youtube.com/watch?v=JGwWNGJdvx8",
    embedUrl:
      "https://www.youtube.com/embed/JGwWNGJdvx8?autoplay=1&rel=0&modestbranding=1",
  },
  {
    id: "hTWKbfoikeg",
    type: "video",
    title: "Nirvana - Smells Like Teen Spirit (Official Music Video)",
    description:
      "Official Music Video for Smells Like Teen Spirit performed by Nirvana...",
    thumbnail: {
      default: "https://i.ytimg.com/vi/hTWKbfoikeg/default.jpg",
      medium: "https://i.ytimg.com/vi/hTWKbfoikeg/mqdefault.jpg",
      high: "https://i.ytimg.com/vi/hTWKbfoikeg/hqdefault.jpg",
    },
    channelTitle: "NirvanaVEVO",
    channelId: "UCDMZlIIJZplFWwIYWG8QqiQ",
    publishedAt: "2013-07-16T17:00:07Z",
    viewCount: "1800000000",
    url: "https://www.youtube.com/watch?v=hTWKbfoikeg",
    embedUrl:
      "https://www.youtube.com/embed/hTWKbfoikeg?autoplay=1&rel=0&modestbranding=1",
  },
  {
    id: "YQHsXMglC9A",
    type: "video",
    title: "Adele - Hello (Official Music Video)",
    description: "Adele's official music video for 'Hello'...",
    thumbnail: {
      default: "https://i.ytimg.com/vi/YQHsXMglC9A/default.jpg",
      medium: "https://i.ytimg.com/vi/YQHsXMglC9A/mqdefault.jpg",
      high: "https://i.ytimg.com/vi/YQHsXMglC9A/hqdefault.jpg",
    },
    channelTitle: "AdeleVEVO",
    channelId: "UComP_epzeKzvBX156r6pm1Q",
    publishedAt: "2015-10-22T15:00:00Z",
    viewCount: "3200000000",
    url: "https://www.youtube.com/watch?v=YQHsXMglC9A",
    embedUrl:
      "https://www.youtube.com/embed/YQHsXMglC9A?autoplay=1&rel=0&modestbranding=1",
  },
];

const getDemoSearchResults = (query, maxResults) => {
  const searchTerm = query.toLowerCase();

  const filteredResults = mockYouTubeData.filter(
    (video) =>
      video.title.toLowerCase().includes(searchTerm) ||
      video.description.toLowerCase().includes(searchTerm) ||
      video.channelTitle.toLowerCase().includes(searchTerm),
  );

  const results =
    filteredResults.length > 0 ? filteredResults : mockYouTubeData;
  return results.slice(0, maxResults);
};

const withComputedVideoFields = (video) => ({
  ...video,
  formattedDuration: parseDuration(video.duration),
  formattedViewCount: formatViewCount(video.viewCount),
});

const clampNumber = (value, min, max, fallback) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(parsed, min), max);
};

const clampFloat = (value, min, max, fallback) => {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(parsed, min), max);
};

const normalizeSearchText = (value = "") =>
  String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const tokenizeSearchText = (value = "") =>
  normalizeSearchText(value)
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean);

const levenshteinDistance = (source, target) => {
  const a = String(source || "");
  const b = String(target || "");

  if (a === b) {
    return 0;
  }

  if (!a.length) {
    return b.length;
  }

  if (!b.length) {
    return a.length;
  }

  const previous = new Array(b.length + 1);
  const current = new Array(b.length + 1);

  for (let index = 0; index <= b.length; index += 1) {
    previous[index] = index;
  }

  for (let i = 0; i < a.length; i += 1) {
    current[0] = i + 1;

    for (let j = 0; j < b.length; j += 1) {
      const insertion = current[j] + 1;
      const deletion = previous[j + 1] + 1;
      const substitution = previous[j] + (a[i] === b[j] ? 0 : 1);

      current[j + 1] = Math.min(insertion, deletion, substitution);
    }

    for (let j = 0; j <= b.length; j += 1) {
      previous[j] = current[j];
    }
  }

  return previous[b.length];
};

const tokenSimilarity = (queryToken, candidateToken) => {
  const query = String(queryToken || "");
  const candidate = String(candidateToken || "");

  if (!query || !candidate) {
    return 0;
  }

  if (query === candidate) {
    return 1;
  }

  if (candidate.startsWith(query) || query.startsWith(candidate)) {
    return 0.94;
  }

  if (candidate.includes(query) || query.includes(candidate)) {
    return 0.86;
  }

  if (query.charAt(0) !== candidate.charAt(0)) {
    return 0;
  }

  const distance = levenshteinDistance(query, candidate);
  const maxLength = Math.max(query.length, candidate.length);

  if (!maxLength) {
    return 0;
  }

  return 1 - distance / maxLength;
};

const tokenCoverageScore = (queryTokens, candidateTokens) => {
  if (!queryTokens.length) {
    return 0.4;
  }

  let weightedScore = 0;
  let matchedTokens = 0;

  queryTokens.forEach((queryToken) => {
    let bestSimilarity = 0;

    candidateTokens.forEach((candidateToken) => {
      const similarity = tokenSimilarity(queryToken, candidateToken);
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
      }
    });

    if (bestSimilarity >= 0.62) {
      matchedTokens += 1;
    }

    weightedScore += bestSimilarity >= 0.45 ? bestSimilarity : 0;
  });

  const averageSimilarity = weightedScore / queryTokens.length;
  const coverage = matchedTokens / queryTokens.length;

  return averageSimilarity * 0.7 + coverage * 0.3;
};

const SHOPPING_MARKETPLACES = [
  {
    marketplace: "Amazon",
    buildUrl: (query) =>
      `https://www.amazon.in/s?k=${encodeURIComponent(query)}`,
  },
  {
    marketplace: "Flipkart",
    buildUrl: (query) =>
      `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`,
  },
  {
    marketplace: "Myntra",
    buildUrl: (query) => `https://www.myntra.com/${encodeURIComponent(query)}`,
  },
  {
    marketplace: "Ajio",
    buildUrl: (query) =>
      `https://www.ajio.com/search/?text=${encodeURIComponent(query)}`,
  },
];

const SHOPPING_SEED_PRODUCTS = [
  {
    id: "sp001",
    title: "Apple iPhone 15 128GB Blue",
    description: "Dynamic Island, A16 chip, and all-day battery life.",
    brand: "Apple",
    category: "Smartphones",
    priceInr: 79900,
    discountedPriceInr: 73999,
    rating: 4.7,
    stock: 17,
    thumbnail: "https://picsum.photos/seed/iphone15/800/500",
  },
  {
    id: "sp002",
    title: "Samsung Galaxy S23 FE 256GB",
    description: "Powerful camera setup with flagship-grade performance.",
    brand: "Samsung",
    category: "Smartphones",
    priceInr: 69999,
    discountedPriceInr: 57999,
    rating: 4.5,
    stock: 21,
    thumbnail: "https://picsum.photos/seed/galaxys23fe/800/500",
  },
  {
    id: "sp003",
    title: "OnePlus 12R 16GB 256GB",
    description: "Snapdragon performance with ultra-fast charging.",
    brand: "OnePlus",
    category: "Smartphones",
    priceInr: 45999,
    discountedPriceInr: 41999,
    rating: 4.6,
    stock: 24,
    thumbnail: "https://picsum.photos/seed/oneplus12r/800/500",
  },
  {
    id: "sp004",
    title: "Nothing Phone 2a 256GB",
    description: "Clean software and unique glyph design language.",
    brand: "Nothing",
    category: "Smartphones",
    priceInr: 29999,
    discountedPriceInr: 25999,
    rating: 4.4,
    stock: 36,
    thumbnail: "https://picsum.photos/seed/nothing2a/800/500",
  },
  {
    id: "sp005",
    title: "Redmi Note 13 Pro 5G",
    description: "High-resolution camera and bright AMOLED display.",
    brand: "Xiaomi",
    category: "Smartphones",
    priceInr: 28999,
    discountedPriceInr: 24999,
    rating: 4.3,
    stock: 32,
    thumbnail: "https://picsum.photos/seed/redminote13pro/800/500",
  },
  {
    id: "sp006",
    title: "Motorola Edge 50 Fusion",
    description: "Curved display, clean UI, and turbo charging support.",
    brand: "Motorola",
    category: "Smartphones",
    priceInr: 26999,
    discountedPriceInr: 23999,
    rating: 4.2,
    stock: 0,
    thumbnail: "https://picsum.photos/seed/motoedge50/800/500",
  },
  {
    id: "lp001",
    title: "Apple MacBook Air M2 13-inch",
    description: "Thin and light laptop with efficient M2 chip.",
    brand: "Apple",
    category: "Laptops",
    priceInr: 114900,
    discountedPriceInr: 104990,
    rating: 4.8,
    stock: 9,
    thumbnail: "https://picsum.photos/seed/macbookairm2/800/500",
  },
  {
    id: "lp002",
    title: "Dell Inspiron 14 5430 Intel i5",
    description: "Reliable everyday laptop for work and college.",
    brand: "Dell",
    category: "Laptops",
    priceInr: 72999,
    discountedPriceInr: 65999,
    rating: 4.4,
    stock: 14,
    thumbnail: "https://picsum.photos/seed/dellinspiron14/800/500",
  },
  {
    id: "lp003",
    title: "HP Pavilion 15 Ryzen 7",
    description: "Balanced performance with modern design and SSD storage.",
    brand: "HP",
    category: "Laptops",
    priceInr: 78999,
    discountedPriceInr: 70999,
    rating: 4.3,
    stock: 12,
    thumbnail: "https://picsum.photos/seed/hppavilion15/800/500",
  },
  {
    id: "lp004",
    title: "Lenovo IdeaPad Slim 5 14-inch",
    description: "Portable productivity laptop with good battery backup.",
    brand: "Lenovo",
    category: "Laptops",
    priceInr: 69999,
    discountedPriceInr: 61999,
    rating: 4.4,
    stock: 18,
    thumbnail: "https://picsum.photos/seed/ideapadslim5/800/500",
  },
  {
    id: "lp005",
    title: "ASUS Vivobook 15 OLED",
    description: "Vivid OLED panel and fast SSD for daily multitasking.",
    brand: "ASUS",
    category: "Laptops",
    priceInr: 74999,
    discountedPriceInr: 66999,
    rating: 4.3,
    stock: 11,
    thumbnail: "https://picsum.photos/seed/vivobook15oled/800/500",
  },
  {
    id: "lp006",
    title: "Acer Swift Go 14 OLED",
    description: "Slim premium laptop with excellent display quality.",
    brand: "Acer",
    category: "Laptops",
    priceInr: 84999,
    discountedPriceInr: 77999,
    rating: 4.2,
    stock: 7,
    thumbnail: "https://picsum.photos/seed/acerswiftgo14/800/500",
  },
  {
    id: "au001",
    title: "Sony WH-1000XM5 Wireless Headphones",
    description: "Industry-leading ANC and premium sound signature.",
    brand: "Sony",
    category: "Audio",
    priceInr: 34990,
    discountedPriceInr: 27990,
    rating: 4.7,
    stock: 15,
    thumbnail: "https://picsum.photos/seed/sonyxm5/800/500",
  },
  {
    id: "au002",
    title: "JBL Tune 770NC Bluetooth Headphones",
    description: "Adaptive noise canceling and long battery runtime.",
    brand: "JBL",
    category: "Audio",
    priceInr: 9999,
    discountedPriceInr: 7499,
    rating: 4.4,
    stock: 26,
    thumbnail: "https://picsum.photos/seed/jbl770nc/800/500",
  },
  {
    id: "au003",
    title: "boAt Nirvana 751 ANC Headphones",
    description: "Budget-friendly ANC headphones with bass-focused sound.",
    brand: "boAt",
    category: "Audio",
    priceInr: 6990,
    discountedPriceInr: 4299,
    rating: 4.1,
    stock: 33,
    thumbnail: "https://picsum.photos/seed/boat751/800/500",
  },
  {
    id: "au004",
    title: "Apple AirPods Pro 2nd Generation",
    description: "Advanced active noise cancellation and spatial audio.",
    brand: "Apple",
    category: "Audio",
    priceInr: 24900,
    discountedPriceInr: 21999,
    rating: 4.8,
    stock: 13,
    thumbnail: "https://picsum.photos/seed/airpodspro2/800/500",
  },
  {
    id: "au005",
    title: "Realme Buds Air 5 Pro",
    description: "Dual-driver TWS earbuds with LDAC support.",
    brand: "Realme",
    category: "Audio",
    priceInr: 6999,
    discountedPriceInr: 4999,
    rating: 4.2,
    stock: 28,
    thumbnail: "https://picsum.photos/seed/realmebudsair5pro/800/500",
  },
  {
    id: "au006",
    title: "Noise Buds VS104 Max",
    description: "Affordable earbuds with strong battery backup.",
    brand: "Noise",
    category: "Audio",
    priceInr: 3499,
    discountedPriceInr: 1899,
    rating: 4.0,
    stock: 41,
    thumbnail: "https://picsum.photos/seed/noisebuds104/800/500",
  },
  {
    id: "fw001",
    title: "Nike Air Max Alpha Trainer",
    description: "Cushioned trainers for gym and daily wear.",
    brand: "Nike",
    category: "Footwear",
    priceInr: 8995,
    discountedPriceInr: 6299,
    rating: 4.5,
    stock: 22,
    thumbnail: "https://picsum.photos/seed/nikeairmaxalpha/800/500",
  },
  {
    id: "fw002",
    title: "Adidas Ultraboost Light Running Shoes",
    description: "Responsive running shoes with breathable mesh upper.",
    brand: "Adidas",
    category: "Footwear",
    priceInr: 16999,
    discountedPriceInr: 11999,
    rating: 4.6,
    stock: 10,
    thumbnail: "https://picsum.photos/seed/adidasultraboost/800/500",
  },
  {
    id: "fw003",
    title: "Puma Smashic Sneakers",
    description: "Classic lifestyle sneakers with cushioned sole.",
    brand: "Puma",
    category: "Footwear",
    priceInr: 5499,
    discountedPriceInr: 3799,
    rating: 4.2,
    stock: 31,
    thumbnail: "https://picsum.photos/seed/pumasmashic/800/500",
  },
  {
    id: "fw004",
    title: "Skechers Go Walk Flex",
    description: "Slip-on comfort shoes built for long walking hours.",
    brand: "Skechers",
    category: "Footwear",
    priceInr: 6999,
    discountedPriceInr: 5299,
    rating: 4.4,
    stock: 19,
    thumbnail: "https://picsum.photos/seed/skechersgowalk/800/500",
  },
  {
    id: "fw005",
    title: "Bata Comfit Formal Loafer",
    description: "Comfort-oriented formal loafers for office wear.",
    brand: "Bata",
    category: "Footwear",
    priceInr: 2999,
    discountedPriceInr: 2199,
    rating: 4.1,
    stock: 27,
    thumbnail: "https://picsum.photos/seed/bataloafer/800/500",
  },
  {
    id: "fw006",
    title: "Campus Oxyfit Running Shoes",
    description: "Lightweight sports shoes for daily running routines.",
    brand: "Campus",
    category: "Footwear",
    priceInr: 2499,
    discountedPriceInr: 1799,
    rating: 4.0,
    stock: 0,
    thumbnail: "https://picsum.photos/seed/campusoxyfit/800/500",
  },
  {
    id: "bt001",
    title: "Minimalist Niacinamide 10 Percent Serum",
    description: "Daily serum to improve skin texture and reduce marks.",
    brand: "Minimalist",
    category: "Beauty",
    priceInr: 699,
    discountedPriceInr: 559,
    rating: 4.5,
    stock: 52,
    thumbnail: "https://picsum.photos/seed/minimalistserum/800/500",
  },
  {
    id: "bt002",
    title: "Cetaphil Gentle Skin Cleanser 500ml",
    description: "Dermatologist-recommended mild cleanser for dry skin.",
    brand: "Cetaphil",
    category: "Beauty",
    priceInr: 1199,
    discountedPriceInr: 959,
    rating: 4.6,
    stock: 44,
    thumbnail: "https://picsum.photos/seed/cetaphilcleanser/800/500",
  },
  {
    id: "bt003",
    title: "Neutrogena Hydro Boost Water Gel",
    description: "Hydrating gel moisturizer with hyaluronic acid.",
    brand: "Neutrogena",
    category: "Beauty",
    priceInr: 950,
    discountedPriceInr: 799,
    rating: 4.4,
    stock: 38,
    thumbnail: "https://picsum.photos/seed/hydroboostgel/800/500",
  },
  {
    id: "bt004",
    title: "Maybelline Sky High Mascara",
    description: "Lengthening mascara with flexible brush design.",
    brand: "Maybelline",
    category: "Beauty",
    priceInr: 799,
    discountedPriceInr: 599,
    rating: 4.3,
    stock: 49,
    thumbnail: "https://picsum.photos/seed/skyhighmascara/800/500",
  },
  {
    id: "bt005",
    title: "Lakme 9to5 Primer Plus Matte Foundation",
    description: "Long-wear matte finish foundation for daily office look.",
    brand: "Lakme",
    category: "Beauty",
    priceInr: 650,
    discountedPriceInr: 499,
    rating: 4.1,
    stock: 37,
    thumbnail: "https://picsum.photos/seed/lakmefoundation/800/500",
  },
  {
    id: "bt006",
    title: "Nykaa Matte to Last Mini Lipstick Set",
    description: "Compact lipstick combo with everyday wearable shades.",
    brand: "Nykaa",
    category: "Beauty",
    priceInr: 999,
    discountedPriceInr: 749,
    rating: 4.2,
    stock: 29,
    thumbnail: "https://picsum.photos/seed/nykaalipset/800/500",
  },
  {
    id: "hm001",
    title: "Philips Air Fryer NA120",
    description: "Healthy low-oil cooking with rapid air technology.",
    brand: "Philips",
    category: "Home Appliances",
    priceInr: 12995,
    discountedPriceInr: 9499,
    rating: 4.6,
    stock: 16,
    thumbnail: "https://picsum.photos/seed/philipsairfryer/800/500",
  },
  {
    id: "hm002",
    title: "Prestige Deluxe Plus Pressure Cooker 5L",
    description: "ISI-certified cooker suitable for family cooking.",
    brand: "Prestige",
    category: "Home Appliances",
    priceInr: 3299,
    discountedPriceInr: 2499,
    rating: 4.4,
    stock: 34,
    thumbnail: "https://picsum.photos/seed/prestigecooker/800/500",
  },
  {
    id: "hm003",
    title: "IFB 20L Convection Microwave Oven",
    description: "Compact microwave with convection and grill modes.",
    brand: "IFB",
    category: "Home Appliances",
    priceInr: 14990,
    discountedPriceInr: 11990,
    rating: 4.2,
    stock: 8,
    thumbnail: "https://picsum.photos/seed/ifbmicrowave/800/500",
  },
  {
    id: "hm004",
    title: "Eureka Forbes Wet and Dry Vacuum",
    description: "Strong suction vacuum cleaner for home and car.",
    brand: "Eureka Forbes",
    category: "Home Appliances",
    priceInr: 8999,
    discountedPriceInr: 6999,
    rating: 4.1,
    stock: 12,
    thumbnail: "https://picsum.photos/seed/eurekavacuum/800/500",
  },
  {
    id: "hm005",
    title: "Milton Thermosteel Bottle Set",
    description: "Insulated bottle combo suitable for office and travel.",
    brand: "Milton",
    category: "Home Appliances",
    priceInr: 1499,
    discountedPriceInr: 999,
    rating: 4.3,
    stock: 45,
    thumbnail: "https://picsum.photos/seed/miltonbottleset/800/500",
  },
  {
    id: "hm006",
    title: "Bajaj Majesty Electric Kettle 1.7L",
    description: "Fast-boil kettle with auto cut-off safety.",
    brand: "Bajaj",
    category: "Home Appliances",
    priceInr: 1999,
    discountedPriceInr: 1349,
    rating: 4.2,
    stock: 39,
    thumbnail: "https://picsum.photos/seed/bajajkettle/800/500",
  },
  {
    id: "wt001",
    title: "Apple Watch SE 2nd Gen GPS 44mm",
    description: "Fitness tracking and smooth iPhone integration.",
    brand: "Apple",
    category: "Smartwatches",
    priceInr: 32900,
    discountedPriceInr: 28999,
    rating: 4.7,
    stock: 14,
    thumbnail: "https://picsum.photos/seed/applewatchse2/800/500",
  },
  {
    id: "wt002",
    title: "Samsung Galaxy Watch6 Bluetooth 44mm",
    description: "Slim design smartwatch with Samsung health features.",
    brand: "Samsung",
    category: "Smartwatches",
    priceInr: 33999,
    discountedPriceInr: 25999,
    rating: 4.5,
    stock: 11,
    thumbnail: "https://picsum.photos/seed/galaxywatch6/800/500",
  },
  {
    id: "wt003",
    title: "Amazfit GTS 4 Mini",
    description: "Lightweight smartwatch with bright AMOLED screen.",
    brand: "Amazfit",
    category: "Smartwatches",
    priceInr: 9999,
    discountedPriceInr: 7499,
    rating: 4.3,
    stock: 28,
    thumbnail: "https://picsum.photos/seed/amazfitgts4mini/800/500",
  },
  {
    id: "wt004",
    title: "Noise ColorFit Pro 5 Max",
    description: "Affordable smartwatch with calling and AMOLED display.",
    brand: "Noise",
    category: "Smartwatches",
    priceInr: 7999,
    discountedPriceInr: 4999,
    rating: 4.0,
    stock: 42,
    thumbnail: "https://picsum.photos/seed/noisecolorfit5/800/500",
  },
  {
    id: "wt005",
    title: "Fire-Boltt Ninja Call Pro Plus",
    description: "Budget smartwatch with Bluetooth calling support.",
    brand: "Fire-Boltt",
    category: "Smartwatches",
    priceInr: 5999,
    discountedPriceInr: 2499,
    rating: 3.9,
    stock: 48,
    thumbnail: "https://picsum.photos/seed/firebolttninja/800/500",
  },
  {
    id: "wt006",
    title: "Fastrack Reflex Play Plus",
    description: "Colorful smartwatch aimed at fitness beginners.",
    brand: "Fastrack",
    category: "Smartwatches",
    priceInr: 4995,
    discountedPriceInr: 3299,
    rating: 3.8,
    stock: 23,
    thumbnail: "https://picsum.photos/seed/fastrackreflex/800/500",
  },
  {
    id: "tr001",
    title: "American Tourister Laptop Backpack 32L",
    description: "Multi-compartment backpack for college and office.",
    brand: "American Tourister",
    category: "Travel",
    priceInr: 3499,
    discountedPriceInr: 2399,
    rating: 4.4,
    stock: 40,
    thumbnail: "https://picsum.photos/seed/americantourister32l/800/500",
  },
  {
    id: "tr002",
    title: "Wildcraft Trek Backpack 45L",
    description: "Large backpack with rain cover for short trips.",
    brand: "Wildcraft",
    category: "Travel",
    priceInr: 4199,
    discountedPriceInr: 2999,
    rating: 4.3,
    stock: 25,
    thumbnail: "https://picsum.photos/seed/wildcraft45l/800/500",
  },
  {
    id: "tr003",
    title: "Skybags Cabin Luggage 55cm",
    description: "Hard-shell cabin trolley with smooth spinner wheels.",
    brand: "Skybags",
    category: "Travel",
    priceInr: 6999,
    discountedPriceInr: 4999,
    rating: 4.2,
    stock: 18,
    thumbnail: "https://picsum.photos/seed/skybagscabin/800/500",
  },
  {
    id: "tr004",
    title: "Safari Motion Trolley 65cm",
    description: "Medium check-in luggage for weekend or business travel.",
    brand: "Safari",
    category: "Travel",
    priceInr: 8499,
    discountedPriceInr: 6199,
    rating: 4.1,
    stock: 13,
    thumbnail: "https://picsum.photos/seed/safaritrolley65/800/500",
  },
];

const toTitleCase = (value = "") =>
  String(value)
    .split(" ")
    .map((part) =>
      part ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : "",
    )
    .join(" ")
    .trim();

const CATEGORY_INTENT_KEYWORDS = [
  {
    category: "laptops",
    tokens: [
      "laptop",
      "laptops",
      "notebook",
      "notebooks",
      "macbook",
      "ultrabook",
    ],
  },
  {
    category: "smartphones",
    tokens: [
      "phone",
      "phones",
      "smartphone",
      "smartphones",
      "iphone",
      "mobile",
      "android",
    ],
  },
  {
    category: "smartwatches",
    tokens: ["watch", "watches", "smartwatch", "smartwatches"],
  },
  {
    category: "audio",
    tokens: [
      "audio",
      "earbuds",
      "earbud",
      "headphone",
      "headphones",
      "buds",
      "speaker",
    ],
  },
  {
    category: "footwear",
    tokens: [
      "shoe",
      "shoes",
      "sneaker",
      "sneakers",
      "boot",
      "boots",
      "sandals",
    ],
  },
  {
    category: "beauty",
    tokens: [
      "beauty",
      "makeup",
      "skincare",
      "lipstick",
      "serum",
      "cleanser",
      "moisturizer",
    ],
  },
  {
    category: "home appliances",
    tokens: [
      "appliance",
      "appliances",
      "air fryer",
      "microwave",
      "kettle",
      "vacuum",
      "cooker",
    ],
  },
  {
    category: "travel",
    tokens: ["travel", "luggage", "trolley", "suitcase", "backpack", "bag"],
  },
];

const ACCESSORY_TOKENS = new Set([
  "backpack",
  "bag",
  "cover",
  "case",
  "sleeve",
  "skin",
  "strap",
  "charger",
  "cable",
  "adapter",
  "stand",
  "holder",
  "pouch",
]);

const CATEGORY_ACCESSORY_SENSITIVE = new Set([
  "laptops",
  "smartphones",
  "smartwatches",
  "audio",
]);

const detectIntendedCategories = (normalizedQuery, queryTokens) => {
  if (!normalizedQuery || queryTokens.length === 0) {
    return [];
  }

  const categories = new Set();

  CATEGORY_INTENT_KEYWORDS.forEach((entry) => {
    const matched = entry.tokens.some(
      (token) => queryTokens.includes(token) || normalizedQuery.includes(token),
    );

    if (matched) {
      categories.add(entry.category);
    }
  });

  return Array.from(categories);
};

const hasAccessorySignals = (tokens) =>
  tokens.some((token) => ACCESSORY_TOKENS.has(token));

const computeStableHash = (value = "") => {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
};

const buildMarketplaceOffers = (product) => {
  const searchPhrase = String(product?.title || "").trim();
  const basePrice = Math.max(Number(product?.discountedPriceInr) || 0, 1);

  return SHOPPING_MARKETPLACES.map((marketplace) => {
    const hash = computeStableHash(`${product?.id}:${marketplace.marketplace}`);
    const variance = ((hash % 9) - 4) / 100;
    const adjustedPrice = Math.max(1, Math.round(basePrice * (1 + variance)));

    return {
      marketplace: marketplace.marketplace,
      url: marketplace.buildUrl(searchPhrase),
      priceInr: adjustedPrice,
    };
  }).sort((first, second) => first.priceInr - second.priceInr);
};

const buildMarketplaceLinks = (queryText) => {
  const searchPhrase = String(queryText || "").trim();
  return SHOPPING_MARKETPLACES.map((marketplace) => ({
    marketplace: marketplace.marketplace,
    url: marketplace.buildUrl(searchPhrase),
  }));
};

const SHOPPING_CATALOG = SHOPPING_SEED_PRODUCTS.map((product) => {
  const mrp = Math.max(Number(product.priceInr) || 0, 1);
  const discounted = Math.max(
    Math.min(Number(product.discountedPriceInr) || mrp, mrp),
    1,
  );
  const discountPercentage = Math.max(
    0,
    Number((((mrp - discounted) / mrp) * 100).toFixed(1)),
  );

  return {
    id: product.id,
    title: product.title,
    description: product.description,
    brand: product.brand,
    category: product.category,
    priceInr: mrp,
    discountedPriceInr: discounted,
    discountPercentage,
    rating: clampFloat(product.rating, 0, 5, 0),
    stock: Math.max(Number.parseInt(product.stock, 10) || 0, 0),
    inStock: Math.max(Number.parseInt(product.stock, 10) || 0, 0) > 0,
    thumbnail: product.thumbnail,
    searchableText: normalizeSearchText(
      `${product.title} ${product.brand} ${product.category} ${product.description}`,
    ),
  };
});

const SHOPPING_VOCABULARY = Array.from(
  new Set(
    SHOPPING_CATALOG.flatMap((product) =>
      tokenizeSearchText(
        `${product.title} ${product.brand} ${product.category} ${product.description}`,
      ).filter((token) => token.length >= 3),
    ),
  ),
);

const calculateSearchScore = (normalizedQuery, product) => {
  if (!normalizedQuery) {
    return 0.4;
  }

  const queryTokens = tokenizeSearchText(normalizedQuery);
  const intendedCategories = detectIntendedCategories(
    normalizedQuery,
    queryTokens,
  );
  const normalizedTitle = normalizeSearchText(product.title);
  const normalizedBrand = normalizeSearchText(product.brand);
  const normalizedCategory = normalizeSearchText(product.category);
  const normalizedDescription = normalizeSearchText(product.description);
  const titleTokens = tokenizeSearchText(normalizedTitle);
  const descriptionTokens = tokenizeSearchText(normalizedDescription);

  const titleScore = tokenCoverageScore(queryTokens, titleTokens);
  const brandScore = tokenCoverageScore(
    queryTokens,
    tokenizeSearchText(normalizedBrand),
  );
  const categoryScore = tokenCoverageScore(
    queryTokens,
    tokenizeSearchText(normalizedCategory),
  );
  const descriptionScore = tokenCoverageScore(
    queryTokens,
    tokenizeSearchText(normalizedDescription),
  );

  let score =
    titleScore * 0.58 +
    brandScore * 0.2 +
    categoryScore * 0.14 +
    descriptionScore * 0.08;

  if (normalizedTitle.includes(normalizedQuery)) {
    score += 0.45;
  } else if (normalizedDescription.includes(normalizedQuery)) {
    score += 0.08;
  }

  if (normalizedTitle.startsWith(normalizedQuery)) {
    score += 0.2;
  }

  if (normalizedBrand === normalizedQuery) {
    score += 0.12;
  }

  if (intendedCategories.length > 0) {
    if (intendedCategories.includes(normalizedCategory)) {
      score += 0.4;
    } else {
      score -= 0.12;
    }

    const queryNeedsCoreProduct = intendedCategories.some((category) =>
      CATEGORY_ACCESSORY_SENSITIVE.has(category),
    );

    const accessoryLike =
      hasAccessorySignals(titleTokens) ||
      hasAccessorySignals(descriptionTokens);

    if (
      queryNeedsCoreProduct &&
      accessoryLike &&
      !intendedCategories.includes(normalizedCategory)
    ) {
      score -= 0.3;
    }
  }

  if (queryTokens.length === 1) {
    const token = queryTokens[0];

    if (normalizedCategory.includes(token)) {
      score += 0.18;
    }

    if (normalizedDescription.includes(token)) {
      score += 0.08;
    }
  }

  return Math.max(score, -1);
};

const buildFacetCounts = (items, field) => {
  const counts = new Map();

  items.forEach((item) => {
    const key = String(item[field] || "").trim();
    if (!key) {
      return;
    }

    counts.set(key, (counts.get(key) || 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((first, second) => {
      if (second.count !== first.count) {
        return second.count - first.count;
      }

      return first.value.localeCompare(second.value);
    });
};

const buildDidYouMeanQuery = (query) => {
  const queryTokens = tokenizeSearchText(query);
  if (!queryTokens.length) {
    return null;
  }

  let updated = false;

  const correctedTokens = queryTokens.map((token) => {
    if (SHOPPING_VOCABULARY.includes(token)) {
      return token;
    }

    let bestToken = token;
    let bestScore = 0;

    SHOPPING_VOCABULARY.forEach((vocabularyToken) => {
      const similarity = tokenSimilarity(token, vocabularyToken);
      if (similarity > bestScore) {
        bestScore = similarity;
        bestToken = vocabularyToken;
      }
    });

    if (bestScore >= 0.78 && bestToken !== token) {
      updated = true;
      return bestToken;
    }

    return token;
  });

  if (!updated) {
    return null;
  }

  return correctedTokens.join(" ");
};

const applySort = (items, sortBy = "relevance") => {
  const sorted = [...items];

  switch (sortBy) {
    case "price_asc":
      return sorted.sort(
        (first, second) =>
          first.discountedPriceInr - second.discountedPriceInr ||
          second.rating - first.rating,
      );
    case "price_desc":
      return sorted.sort(
        (first, second) =>
          second.discountedPriceInr - first.discountedPriceInr ||
          second.rating - first.rating,
      );
    case "rating_desc":
      return sorted.sort(
        (first, second) =>
          second.rating - first.rating ||
          first.discountedPriceInr - second.discountedPriceInr,
      );
    case "discount_desc":
      return sorted.sort(
        (first, second) =>
          second.discountPercentage - first.discountPercentage ||
          first.discountedPriceInr - second.discountedPriceInr,
      );
    case "relevance":
    default:
      return sorted.sort(
        (first, second) =>
          second.searchScore - first.searchScore ||
          second.rating - first.rating ||
          first.discountedPriceInr - second.discountedPriceInr,
      );
  }
};

const executeShoppingSearch = ({
  normalizedQuery,
  category,
  brand,
  minPrice,
  maxPrice,
  minRating,
  includeOutOfStock,
  sortBy,
}) => {
  const queryTokens = tokenizeSearchText(normalizedQuery);
  const threshold = normalizedQuery
    ? queryTokens.length === 1
      ? 0.24
      : Math.max(0.3, 0.56 - queryTokens.length * 0.05)
    : 0;

  let scored = SHOPPING_CATALOG.map((product) => ({
    ...product,
    searchScore: calculateSearchScore(normalizedQuery, product),
  }));

  if (normalizedQuery) {
    const directMatches = scored.filter(
      (product) => product.searchScore >= threshold,
    );

    if (directMatches.length > 0) {
      scored = directMatches;
    } else {
      scored = scored
        .sort((first, second) => second.searchScore - first.searchScore)
        .slice(0, 16)
        .filter((product) => product.searchScore >= 0.25);
    }
  }

  const scoped = scored.filter((product) => {
    if (!includeOutOfStock && !product.inStock) {
      return false;
    }

    if (minRating > 0 && product.rating < minRating) {
      return false;
    }

    if (minPrice !== null && product.discountedPriceInr < minPrice) {
      return false;
    }

    if (maxPrice !== null && product.discountedPriceInr > maxPrice) {
      return false;
    }

    return true;
  });

  const facets = {
    categories: buildFacetCounts(scoped, "category"),
    brands: buildFacetCounts(scoped, "brand"),
  };

  const filtered = scoped.filter((product) => {
    if (
      category !== "all" &&
      normalizeSearchText(product.category) !== category
    ) {
      return false;
    }

    if (brand !== "all" && normalizeSearchText(product.brand) !== brand) {
      return false;
    }

    return true;
  });

  return {
    products: applySort(filtered, sortBy),
    facets,
    topScore:
      filtered.length > 0
        ? Math.max(...filtered.map((product) => product.searchScore || 0))
        : 0,
  };
};

app.get("/api/health", (_req, res) => {
  setNoStoreHeaders(res);

  res.json(
    createSuccess(
      {
        service: "youtube-api-server",
        status: "ok",
        uptimeSeconds: Math.floor(process.uptime()),
        cacheProvider: cacheStore.type,
        memoryCacheEntries: apiResponseCache.size,
        redisEnabled: Boolean(REDIS_URL),
        redisReady: cacheStore.redisReady,
        redisTlsEnabled: REDIS_TLS_ENABLED,
        metricsEnabled: METRICS_ENABLED,
      },
      {
        mode: YOUTUBE_API_KEY ? "live" : "demo",
        rateLimit: {
          windowMs: API_RATE_LIMIT_WINDOW_MS,
          globalMaxRequests: API_RATE_LIMIT_MAX_REQUESTS,
          searchMaxRequests: API_RATE_LIMIT_SEARCH_MAX_REQUESTS,
          videoMaxRequests: API_RATE_LIMIT_VIDEO_MAX_REQUESTS,
          trendingMaxRequests: API_RATE_LIMIT_TRENDING_MAX_REQUESTS,
          shoppingMaxRequests: API_RATE_LIMIT_SHOPPING_MAX_REQUESTS,
          metricsMaxRequests: API_RATE_LIMIT_METRICS_MAX_REQUESTS,
        },
      },
    ),
  );
});

app.get("/api", (_req, res) => {
  setNoStoreHeaders(res);

  res.json(
    createSuccess({
      message: "OUR-WEBSITE API is running",
      endpoints: [
        "/api/health",
        "/api/metrics",
        "/api/youtube/search",
        "/api/youtube/video/:videoId",
        "/api/youtube/trending",
        "/api/shopping/search",
        "/api/compare/platforms",
        "/api/compare",
      ],
    }),
  );
});

app.get("/api/compare/platforms", (_req, res) => {
  setNoStoreHeaders(res);

  return res.status(200).json(
    createSuccess({
      platforms: getCompareSupportedPlatforms(),
    }),
  );
});

app.post("/api/compare", async (req, res) => {
  const payload = req.body && typeof req.body === "object" ? req.body : {};
  const query = String(payload.query || "").trim();

  if (!query) {
    return res
      .status(400)
      .json(createError("query is required", { field: "query" }));
  }

  try {
    const results = await compareProducts({
      query,
      platforms: payload.platforms,
      minPrice: payload.minPrice,
      maxPrice: payload.maxPrice,
      sort: payload.sort,
    });

    return res.status(200).json(results);
  } catch (error) {
    console.error("Shopping compare failed:", error.message);
    return res.status(502).json(createError("Failed to compare products"));
  }
});

app.get("/api/metrics", async (_req, res) => {
  setNoStoreHeaders(res);

  if (!METRICS_ENABLED) {
    return res.status(404).json(createError("Metrics endpoint is disabled"));
  }

  try {
    res.set("Content-Type", metricsRegistry.contentType);
    const metricsText = await metricsRegistry.metrics();
    return res.status(200).send(metricsText);
  } catch {
    return res.status(500).json(createError("Failed to render metrics"));
  }
});

app.get("/api/youtube/search", async (req, res) => {
  const query = String(req.query.q || "").trim();
  const maxResults = clampMaxResults(req.query.maxResults, 10);
  const type = String(req.query.type || "video");

  if (!query) {
    return res
      .status(400)
      .json(createError("Search query is required", { field: "q" }));
  }

  setApiCacheHeaders(res, SEARCH_CACHE_TTL_MS);

  const cacheKey = `search:${query.toLowerCase()}:${maxResults}:${type}`;
  const cachedResponse = await getCachedResponse(cacheKey);
  if (cachedResponse) {
    recordCacheEvent("/api/youtube/search", "hit");
    return res.set("X-Cache", "HIT").json(cachedResponse);
  }

  if (!YOUTUBE_API_KEY) {
    const demoResults = getDemoSearchResults(query, maxResults);
    const payload = createSuccess(demoResults, {
      totalResults: demoResults.length,
      resultsPerPage: demoResults.length,
      source: "demo_data",
      note: "Set YOUTUBE_API_KEY to enable live YouTube search.",
    });

    await setCachedResponse(cacheKey, payload, SEARCH_CACHE_TTL_MS);
    recordCacheEvent("/api/youtube/search", "miss");
    return res.set("X-Cache", "MISS").json(payload);
  }

  try {
    const response = await youtubeClient.get("/search", {
      params: {
        part: "snippet",
        q: query,
        type,
        maxResults,
        key: YOUTUBE_API_KEY,
        order: "relevance",
        safeSearch: "moderate",
      },
    });

    const formattedResults = formatSearchResults(response.data.items || []);

    const payload = createSuccess(formattedResults, {
      totalResults: response.data.pageInfo?.totalResults || 0,
      resultsPerPage: response.data.pageInfo?.resultsPerPage || 0,
      source: "youtube_api",
    });

    await setCachedResponse(cacheKey, payload, SEARCH_CACHE_TTL_MS);
    recordCacheEvent("/api/youtube/search", "miss");
    return res.set("X-Cache", "MISS").json(payload);
  } catch (error) {
    const fallbackResults = getDemoSearchResults(query, maxResults);

    const payload = createSuccess(fallbackResults, {
      totalResults: fallbackResults.length,
      resultsPerPage: fallbackResults.length,
      source: "demo_data",
      note:
        error.response?.data?.error?.message ||
        "YouTube API unavailable. Returned demo data.",
    });

    await setCachedResponse(cacheKey, payload, SEARCH_CACHE_TTL_MS);
    recordCacheEvent("/api/youtube/search", "miss");
    return res.set("X-Cache", "MISS").json(payload);
  }
});

app.get("/api/youtube/video/:videoId", async (req, res) => {
  const videoId = String(req.params.videoId || "").trim();

  if (!videoId) {
    return res
      .status(400)
      .json(createError("Video ID is required", { field: "videoId" }));
  }

  setApiCacheHeaders(res, VIDEO_CACHE_TTL_MS);

  const cacheKey = `video:${videoId}`;
  const cachedResponse = await getCachedResponse(cacheKey);
  if (cachedResponse) {
    recordCacheEvent("/api/youtube/video/:videoId", "hit");
    return res.set("X-Cache", "HIT").json(cachedResponse);
  }

  if (!YOUTUBE_API_KEY) {
    const fallback = mockYouTubeData.find((video) => video.id === videoId);

    if (!fallback) {
      return res.status(404).json(createError("Video not found"));
    }

    const payload = createSuccess(withComputedVideoFields(fallback), {
      source: "demo_data",
    });

    await setCachedResponse(cacheKey, payload, VIDEO_CACHE_TTL_MS);
    recordCacheEvent("/api/youtube/video/:videoId", "miss");
    return res.set("X-Cache", "MISS").json(payload);
  }

  try {
    const response = await youtubeClient.get("/videos", {
      params: {
        part: "snippet,statistics,contentDetails",
        id: videoId,
        key: YOUTUBE_API_KEY,
      },
    });

    if (!response.data.items || response.data.items.length === 0) {
      return res.status(404).json(createError("Video not found"));
    }

    const videoDetails = formatVideoDetails(response.data.items[0]);

    const payload = createSuccess({
      ...videoDetails,
      formattedDuration: parseDuration(videoDetails.duration),
      formattedViewCount: formatViewCount(videoDetails.viewCount),
    });

    await setCachedResponse(cacheKey, payload, VIDEO_CACHE_TTL_MS);
    recordCacheEvent("/api/youtube/video/:videoId", "miss");
    return res.set("X-Cache", "MISS").json(payload);
  } catch (error) {
    if (error.response?.status === 403) {
      return res
        .status(403)
        .json(createError("YouTube API quota exceeded or invalid API key"));
    }

    if (error.response?.status === 404) {
      return res.status(404).json(createError("Video not found"));
    }

    return res.status(500).json(createError("Failed to get video details"));
  }
});

app.get("/api/youtube/trending", async (req, res) => {
  const maxResults = clampMaxResults(req.query.maxResults, 10);
  const categoryId = req.query.categoryId;
  const regionCode = String(req.query.regionCode || "US");

  setApiCacheHeaders(res, TRENDING_CACHE_TTL_MS);

  const cacheKey = `trending:${maxResults}:${categoryId || "all"}:${regionCode}`;
  const cachedResponse = await getCachedResponse(cacheKey);
  if (cachedResponse) {
    recordCacheEvent("/api/youtube/trending", "hit");
    return res.set("X-Cache", "HIT").json(cachedResponse);
  }

  if (!YOUTUBE_API_KEY) {
    const fallback = mockYouTubeData
      .slice(0, maxResults)
      .map(withComputedVideoFields);

    const payload = createSuccess(fallback, {
      totalResults: fallback.length,
      source: "demo_data",
      note: "Set YOUTUBE_API_KEY to enable live trending videos.",
    });

    await setCachedResponse(cacheKey, payload, TRENDING_CACHE_TTL_MS);
    recordCacheEvent("/api/youtube/trending", "miss");
    return res.set("X-Cache", "MISS").json(payload);
  }

  try {
    const params = {
      part: "snippet,statistics,contentDetails",
      chart: "mostPopular",
      maxResults,
      regionCode,
      key: YOUTUBE_API_KEY,
    };

    if (categoryId) {
      params.videoCategoryId = categoryId;
    }

    const response = await youtubeClient.get("/videos", { params });

    const formattedResults = (response.data.items || []).map((item) => {
      const formatted = formatVideoDetails(item);
      return {
        ...formatted,
        formattedDuration: parseDuration(formatted.duration),
        formattedViewCount: formatViewCount(formatted.viewCount),
      };
    });

    const payload = createSuccess(formattedResults, {
      totalResults:
        response.data.pageInfo?.totalResults || formattedResults.length,
      source: "youtube_api",
    });

    await setCachedResponse(cacheKey, payload, TRENDING_CACHE_TTL_MS);
    recordCacheEvent("/api/youtube/trending", "miss");
    return res.set("X-Cache", "MISS").json(payload);
  } catch (_error) {
    return res.status(500).json(createError("Failed to get trending videos"));
  }
});

app.get("/api/shopping/search", async (req, res) => {
  const rawQuery = String(req.query.query || req.query.q || "").trim();
  const normalizedQuery = normalizeSearchText(rawQuery);

  const rawCategory = String(req.query.category || "all").trim();
  const rawBrand = String(req.query.brand || "all").trim();

  const category = rawCategory ? normalizeSearchText(rawCategory) : "all";
  const brand = rawBrand ? normalizeSearchText(rawBrand) : "all";

  const minPriceInput = String(req.query.minPrice || "").trim();
  const maxPriceInput = String(req.query.maxPrice || "").trim();

  const minPrice = minPriceInput ? Number.parseFloat(minPriceInput) : null;
  const maxPrice = maxPriceInput ? Number.parseFloat(maxPriceInput) : null;

  if (minPriceInput && (!Number.isFinite(minPrice) || minPrice < 0)) {
    return res.status(400).json(
      createError("minPrice must be a positive number", {
        field: "minPrice",
      }),
    );
  }

  if (maxPriceInput && (!Number.isFinite(maxPrice) || maxPrice < 0)) {
    return res.status(400).json(
      createError("maxPrice must be a positive number", {
        field: "maxPrice",
      }),
    );
  }

  if (
    Number.isFinite(minPrice) &&
    Number.isFinite(maxPrice) &&
    minPrice > maxPrice
  ) {
    return res.status(400).json(
      createError("minPrice cannot be greater than maxPrice", {
        field: "minPrice",
      }),
    );
  }

  const minRating = clampFloat(req.query.minRating, 0, 5, 0);
  const page = clampNumber(req.query.page, 1, 200, 1);
  const limit = clampNumber(req.query.limit, 1, 48, 24);

  const sortByRaw = String(req.query.sortBy || "relevance")
    .trim()
    .toLowerCase();
  const allowedSortOptions = new Set([
    "relevance",
    "price_asc",
    "price_desc",
    "rating_desc",
    "discount_desc",
  ]);
  const sortBy = allowedSortOptions.has(sortByRaw) ? sortByRaw : "relevance";

  const includeOutOfStock = parseBooleanFlag(
    req.query.includeOutOfStock,
    false,
  );

  setApiCacheHeaders(res, SHOPPING_CACHE_TTL_MS);

  const cacheKey = [
    "shopping",
    normalizedQuery || "all",
    category || "all",
    brand || "all",
    Number.isFinite(minPrice) ? String(minPrice) : "any",
    Number.isFinite(maxPrice) ? String(maxPrice) : "any",
    String(minRating),
    sortBy,
    String(page),
    String(limit),
    includeOutOfStock ? "stock:any" : "stock:in",
  ].join(":");

  const cachedResponse = await getCachedResponse(cacheKey);
  if (cachedResponse) {
    recordCacheEvent("/api/shopping/search", "hit");
    return res.set("X-Cache", "HIT").json(cachedResponse);
  }

  const searchParams = {
    normalizedQuery,
    category: category || "all",
    brand: brand || "all",
    minPrice: Number.isFinite(minPrice) ? minPrice : null,
    maxPrice: Number.isFinite(maxPrice) ? maxPrice : null,
    minRating,
    includeOutOfStock,
    sortBy,
  };

  let searchResult = executeShoppingSearch(searchParams);
  let correction = null;

  if (normalizedQuery) {
    const suggestedQuery = buildDidYouMeanQuery(normalizedQuery);

    if (suggestedQuery && suggestedQuery !== normalizedQuery) {
      const fallbackResult = executeShoppingSearch({
        ...searchParams,
        normalizedQuery: suggestedQuery,
      });

      const shouldApplyFallback =
        (searchResult.products.length === 0 &&
          fallbackResult.products.length > 0) ||
        (fallbackResult.products.length >= searchResult.products.length + 3 &&
          fallbackResult.topScore >= searchResult.topScore - 0.05);

      if (shouldApplyFallback) {
        searchResult = fallbackResult;
        correction = {
          originalQuery: rawQuery,
          didYouMean: toTitleCase(suggestedQuery),
          applied: true,
        };
      } else {
        correction = {
          originalQuery: rawQuery,
          didYouMean: toTitleCase(suggestedQuery),
          applied: false,
        };
      }
    }
  }

  const totalResults = searchResult.products.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / limit));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * limit;
  const paginatedItems = searchResult.products.slice(start, start + limit);

  const priceValues = searchResult.products.map(
    (product) => product.discountedPriceInr,
  );

  const priceRangeInr =
    priceValues.length > 0
      ? {
          min: Math.min(...priceValues),
          max: Math.max(...priceValues),
        }
      : null;

  const items = paginatedItems.map((product) => {
    const marketplaceOffers = buildMarketplaceOffers(product);
    const marketplacePriceValues = marketplaceOffers.map(
      (offer) => offer.priceInr,
    );

    return {
      id: product.id,
      title: product.title,
      description: product.description,
      brand: product.brand,
      category: product.category,
      priceInr: product.priceInr,
      discountedPriceInr: product.discountedPriceInr,
      discountPercentage: product.discountPercentage,
      rating: product.rating,
      stock: product.stock,
      inStock: product.inStock,
      thumbnail: product.thumbnail,
      marketplaceOffers,
      bestMarketplaceOffer: marketplaceOffers[0] || null,
      marketplacePriceRangeInr:
        marketplacePriceValues.length > 0
          ? {
              min: Math.min(...marketplacePriceValues),
              max: Math.max(...marketplacePriceValues),
            }
          : null,
      marketplaceLinks: marketplaceOffers.map((offer) => ({
        marketplace: offer.marketplace,
        url: offer.url,
      })),
    };
  });

  const payload = createSuccess({
    items,
    facets: searchResult.facets,
    summary: {
      totalResults,
      totalPages,
      page: currentPage,
      limit,
      priceRangeInr,
      query: rawQuery,
      queryUsed: correction?.applied ? correction.didYouMean : rawQuery,
      sortBy,
    },
    correction,
    source: "shopping_catalog",
    note: "Results are ranked with typo-tolerant fuzzy matching across product title, brand, category, and description.",
  });

  await setCachedResponse(cacheKey, payload, SHOPPING_CACHE_TTL_MS);
  recordCacheEvent("/api/shopping/search", "miss");

  return res.set("X-Cache", "MISS").json(payload);
});

app.use("/api", (_req, res) => {
  res.status(404).json(createError("API route not found"));
});

app.use((error, _req, res, _next) => {
  console.error("Unhandled server error:", error);
  res.status(500).json(createError("Internal server error"));
});

app.listen(PORT, () => {
  console.log(
    `Server is running on port ${PORT} (${YOUTUBE_API_KEY ? "live" : "demo"} mode)`,
  );
});
