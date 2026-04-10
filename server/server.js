const express = require("express");
const cors = require("cors");
const compression = require("compression");
const axios = require("axios");
const Redis = require("ioredis");
const rateLimit = require("express-rate-limit");
const promClient = require("prom-client");
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

const apiMetricsRateLimiter = createApiRateLimiter({
  limit: API_RATE_LIMIT_METRICS_MAX_REQUESTS,
  code: "API_METRICS_RATE_LIMITED",
  message: "Metrics endpoint rate limit reached.",
});

app.use("/api", apiGlobalRateLimiter);
app.use("/api/youtube/search", apiSearchRateLimiter);
app.use("/api/youtube/video", apiVideoRateLimiter);
app.use("/api/youtube/trending", apiTrendingRateLimiter);
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
      ],
    }),
  );
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
