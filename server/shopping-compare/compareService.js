const axios = require("axios");
const { load } = require("cheerio");
const {
  PLATFORM_CONFIGS,
  getPlatformConfig,
  getSupportedPlatforms,
  resolvePlatformIds,
  detectPlatformIdFromUrl,
} = require("./platforms");
const {
  buildCanonicalTitleKey,
  coerceToHttpUrl,
  isInvalidSearchQuery,
  tokenize,
  similarityScore,
  parsePriceNumber,
} = require("./normalizers");
const { extractProductFromDocument } = require("./extractors");

const SEARCH_TIMEOUT_MS = Number.parseInt(
  process.env.COMPARE_SEARCH_TIMEOUT_MS || "9000",
  10,
);
const PAGE_TIMEOUT_MS = Number.parseInt(
  process.env.COMPARE_PAGE_TIMEOUT_MS || "10000",
  10,
);
const LINKS_PER_PLATFORM = Number.parseInt(
  process.env.COMPARE_LINKS_PER_PLATFORM || "10",
  10,
);
const FETCH_CONCURRENCY = Number.parseInt(
  process.env.COMPARE_FETCH_CONCURRENCY || "4",
  10,
);
const CACHE_TTL_MS = Number.parseInt(
  process.env.COMPARE_CACHE_TTL_MS || "300000",
  10,
);

const BRAVE_SEARCH_BASE_URL = "https://search.brave.com/search";
const YAHOO_SEARCH_BASE_URL = "https://search.yahoo.com/search";
const STRICT_PRODUCT_PATH_PLATFORMS = new Set([
  "amazon",
  "flipkart",
  "myntra",
  "ajio",
]);

const compareCache = new Map();

const buildRequestHeaders = () => ({
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-IN,en;q=0.9",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
});

const buildSearchHeaders = () => ({
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.8",
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const clearExpiredCache = () => {
  const now = Date.now();

  for (const [key, entry] of compareCache.entries()) {
    if (entry.expiresAt <= now) {
      compareCache.delete(key);
    }
  }
};

const getCachedValue = (cacheKey) => {
  clearExpiredCache();

  const cached = compareCache.get(cacheKey);
  if (!cached) {
    return null;
  }

  return cached.payload;
};

const setCachedValue = (cacheKey, payload) => {
  compareCache.set(cacheKey, {
    payload,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
};

const buildCacheKey = ({ query, platforms, minPrice, maxPrice, sort }) => {
  return JSON.stringify({
    query: String(query || "")
      .trim()
      .toLowerCase(),
    platforms,
    minPrice,
    maxPrice,
    sort,
  });
};

const normalizeSortValue = (value) => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  if (normalized === "high-low" || normalized === "price_desc") {
    return "high-low";
  }

  return "low-high";
};

const isPlatformHost = (hostname, platform) => {
  const host = String(hostname || "").toLowerCase();

  if (!host || !platform?.domains?.length) {
    return false;
  }

  return platform.domains.some(
    (domain) => host === domain || host.endsWith(`.${domain}`),
  );
};

const isLikelyProductUrl = (url, platform) => {
  const path = String(url?.pathname || "").toLowerCase();

  if (!path || path === "/") {
    return false;
  }

  const blockedPathFragments = [
    "/search",
    "/wishlist",
    "/cart",
    "/account",
    "/help",
    "/stores",
    "/shop",
    "/categories",
    "/category",
    "/b/",
  ];

  if (blockedPathFragments.some((fragment) => path.includes(fragment))) {
    return false;
  }

  const platformProductPatterns = {
    amazon: [/\/dp\/[a-z0-9]{8,}/i, /\/gp\/product\//i],
    flipkart: [/\/p\/[a-z0-9]+/i],
    myntra: [/\/buy(?:$|\?)/i],
    ajio: [/\/p\/[a-z0-9_-]+/i],
    croma: [/\/[^/]+$/i],
    reliancedigital: [/\/product\//i, /\/p\/\d+/i],
  };

  const patterns = platformProductPatterns[platform?.id] || [];
  if (patterns.length === 0) {
    return path.split("/").filter(Boolean).length >= 2;
  }

  return patterns.some((pattern) => pattern.test(path));
};

const resolvePreferredLinks = (links, platform, maxLinks) => {
  const likelyProductUrls = links.filter((rawUrl) => {
    try {
      return isLikelyProductUrl(new URL(rawUrl), platform);
    } catch {
      return false;
    }
  });

  if (likelyProductUrls.length > 0) {
    return buildUniqueUrls(likelyProductUrls, maxLinks);
  }

  if (STRICT_PRODUCT_PATH_PLATFORMS.has(platform.id)) {
    return [];
  }

  return buildUniqueUrls(links, maxLinks);
};

const sanitizeResultUrl = (rawHref, baseUrl) => {
  const href = String(rawHref || "")
    .trim()
    .replace(/&amp;/gi, "&");
  if (!href) {
    return null;
  }

  if (/^javascript:/i.test(href) || href.startsWith("#")) {
    return null;
  }

  if (/^https?:\/\//i.test(href)) {
    return href;
  }

  if (baseUrl && href.startsWith("/")) {
    try {
      return new URL(href, baseUrl).toString();
    } catch {
      return null;
    }
  }

  return null;
};

const buildUniqueUrls = (urls, maxLinks) =>
  Array.from(new Set(urls.filter(Boolean))).slice(0, maxLinks);

const normalizePlatformResultUrl = (rawUrl) => {
  try {
    const url = new URL(rawUrl);

    if (/amazon\./i.test(url.hostname)) {
      const match = url.pathname.match(/\/dp\/[A-Z0-9]{8,}/i);
      if (match && match[0]) {
        return `${url.origin}${match[0]}`;
      }
    }

    url.hash = "";
    return url.toString();
  } catch {
    return rawUrl;
  }
};

const buildPlatformNativeSearchUrl = (platformId, query) => {
  const normalizedQuery = String(query || "").trim();
  if (!normalizedQuery) {
    return null;
  }

  const slug = normalizedQuery
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "");

  const builders = {
    amazon: () =>
      `https://www.amazon.in/s?k=${encodeURIComponent(normalizedQuery)}`,
    flipkart: () =>
      `https://www.flipkart.com/search?q=${encodeURIComponent(normalizedQuery)}`,
    myntra: () =>
      `https://www.myntra.com/${slug || encodeURIComponent(normalizedQuery)}`,
    ajio: () =>
      `https://www.ajio.com/search/?text=${encodeURIComponent(normalizedQuery)}`,
    croma: () =>
      `https://www.croma.com/searchB?q=${encodeURIComponent(normalizedQuery)}%3Arelevance`,
    reliancedigital: () =>
      `https://www.reliancedigital.in/search?q=${encodeURIComponent(normalizedQuery)}`,
  };

  const builder = builders[platformId];
  return builder ? builder() : null;
};

const parseSearchTextFromUrl = (inputUrl) => {
  try {
    const url = new URL(inputUrl);

    const queryParamKeys = ["q", "query", "k", "keyword", "search", "term"];
    for (const key of queryParamKeys) {
      const value = (url.searchParams.get(key) || "").trim();
      if (value) {
        return value;
      }
    }

    const finalPathSegment = decodeURIComponent(
      url.pathname.split("/").filter(Boolean).pop() || "",
    )
      .replace(/[-_]+/g, " ")
      .trim();

    if (finalPathSegment && finalPathSegment.length > 2) {
      return finalPathSegment;
    }

    return "";
  } catch {
    return "";
  }
};

const parseDuckDuckGoUrl = (rawHref) => {
  const href = String(rawHref || "").trim();

  if (!href) {
    return null;
  }

  if (/^https?:\/\//i.test(href)) {
    return href;
  }

  if (href.startsWith("/l/?")) {
    const parsed = new URL(href, "https://duckduckgo.com");
    const uddg = parsed.searchParams.get("uddg");
    if (uddg) {
      try {
        return decodeURIComponent(uddg);
      } catch {
        return uddg;
      }
    }
  }

  return null;
};

const parseYahooResultUrl = (rawHref) => {
  const href = String(rawHref || "").trim();
  if (!href) {
    return null;
  }

  let absoluteUrl = href;
  if (href.startsWith("/")) {
    try {
      absoluteUrl = new URL(href, "https://search.yahoo.com").toString();
    } catch {
      return null;
    }
  }

  if (!/^https?:\/\//i.test(absoluteUrl)) {
    return null;
  }

  try {
    const parsed = new URL(absoluteUrl);
    const host = parsed.hostname.toLowerCase();

    if (host === "r.search.yahoo.com") {
      const path = parsed.pathname;
      const ruMatch = path.match(/\/RU=([^/]+)/i);
      if (!ruMatch || !ruMatch[1]) {
        return null;
      }

      try {
        return decodeURIComponent(ruMatch[1]);
      } catch {
        return ruMatch[1];
      }
    }

    return parsed.toString();
  } catch {
    return null;
  }
};

const fetchBraveSearchLinks = async ({ query, platform, maxLinks }) => {
  const searchQuery = `${query} site:${platform.searchDomain}`;
  const searchUrl = `${BRAVE_SEARCH_BASE_URL}?q=${encodeURIComponent(searchQuery)}&source=web`;

  const response = await axios.get(searchUrl, {
    timeout: SEARCH_TIMEOUT_MS,
    headers: buildSearchHeaders(),
    validateStatus: (status) => status >= 200 && status < 500,
  });

  if (response.status >= 400) {
    return [];
  }

  const $ = load(response.data);
  const platformUrls = [];

  $("a[href]").each((_index, element) => {
    const rawHref = $(element).attr("href");
    const absoluteUrl = sanitizeResultUrl(rawHref, BRAVE_SEARCH_BASE_URL);
    if (!absoluteUrl) {
      return;
    }

    try {
      const url = new URL(absoluteUrl);

      if (!isPlatformHost(url.hostname, platform)) {
        return;
      }

      platformUrls.push(normalizePlatformResultUrl(url.toString()));
    } catch {
      // Ignore malformed URLs.
    }
  });

  return resolvePreferredLinks(platformUrls, platform, maxLinks);
};

const fetchDuckDuckGoLinks = async ({ query, platform, maxLinks }) => {
  const searchQuery = `${query} site:${platform.searchDomain}`;
  const searchUrl = `https://duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`;

  const response = await axios.get(searchUrl, {
    timeout: SEARCH_TIMEOUT_MS,
    headers: buildSearchHeaders(),
    validateStatus: (status) => status >= 200 && status < 500,
  });

  if (response.status >= 400) {
    return [];
  }

  const $ = load(response.data);
  const links = [];

  $("a.result__a, a[href*='uddg=']").each((_index, element) => {
    const href = $(element).attr("href");
    const parsedUrl = parseDuckDuckGoUrl(href);
    if (!parsedUrl) {
      return;
    }

    try {
      const url = new URL(parsedUrl);

      if (!isPlatformHost(url.hostname, platform)) {
        return;
      }

      links.push(normalizePlatformResultUrl(url.toString()));
    } catch {
      // Ignore malformed URLs.
    }
  });

  return buildUniqueUrls(links, maxLinks);
};

const fetchYahooSearchLinks = async ({ query, platform, maxLinks }) => {
  const searchQuery = `${query} site:${platform.searchDomain}`;
  const searchUrl = `${YAHOO_SEARCH_BASE_URL}?p=${encodeURIComponent(searchQuery)}&nojs=1`;

  const response = await axios.get(searchUrl, {
    timeout: SEARCH_TIMEOUT_MS,
    headers: buildSearchHeaders(),
    validateStatus: (status) => status >= 200 && status < 500,
  });

  if (response.status >= 400) {
    return [];
  }

  const $ = load(response.data);
  const links = [];

  $("a[href]").each((_index, element) => {
    const href = $(element).attr("href");
    const parsedUrl = parseYahooResultUrl(href);
    if (!parsedUrl) {
      return;
    }

    try {
      const url = new URL(parsedUrl);

      if (!isPlatformHost(url.hostname, platform)) {
        return;
      }

      links.push(normalizePlatformResultUrl(url.toString()));
    } catch {
      // Ignore malformed URLs.
    }
  });

  return resolvePreferredLinks(links, platform, maxLinks);
};

const fetchYahooShoppingAmazonLinks = async ({ query, platform, maxLinks }) => {
  if (platform.id !== "amazon") {
    return [];
  }

  const searchUrl = `https://shopping.yahoo.com/search?p=${encodeURIComponent(query)}`;

  const response = await axios.get(searchUrl, {
    timeout: SEARCH_TIMEOUT_MS,
    headers: buildSearchHeaders(),
    validateStatus: (status) => status >= 200 && status < 500,
  });

  if (response.status >= 400) {
    return [];
  }

  const text = String(response.data || "");
  const asinSet = new Set();

  const pidRegex = /pid=amazon[_-]([A-Z0-9]{8,12})/gi;
  for (const match of text.matchAll(pidRegex)) {
    const asin = String(match[1] || "")
      .toUpperCase()
      .trim();
    if (asin) {
      asinSet.add(asin);
    }
  }

  const dpRegex = /\/dp\/([A-Z0-9]{8,12})/gi;
  for (const match of text.matchAll(dpRegex)) {
    const asin = String(match[1] || "")
      .toUpperCase()
      .trim();
    if (asin) {
      asinSet.add(asin);
    }
  }

  const links = Array.from(asinSet).map(
    (asin) => `https://www.amazon.in/dp/${asin}`,
  );

  return resolvePreferredLinks(links, platform, maxLinks);
};

const fetchNativePlatformLinks = async ({ query, platform, maxLinks }) => {
  const searchUrl = buildPlatformNativeSearchUrl(platform.id, query);
  if (!searchUrl) {
    return [];
  }

  const response = await axios.get(searchUrl, {
    timeout: SEARCH_TIMEOUT_MS,
    headers: buildSearchHeaders(),
    maxRedirects: 3,
    validateStatus: (status) => status >= 200 && status < 500,
  });

  if (response.status >= 400) {
    return [];
  }

  const $ = load(response.data);
  const links = [];

  $("a[href]").each((_index, element) => {
    const href = $(element).attr("href");
    const absoluteUrl = sanitizeResultUrl(href, searchUrl);
    if (!absoluteUrl) {
      return;
    }

    try {
      const url = new URL(absoluteUrl);

      if (!isPlatformHost(url.hostname, platform)) {
        return;
      }

      links.push(normalizePlatformResultUrl(url.toString()));
    } catch {
      // Ignore malformed URLs.
    }
  });

  return resolvePreferredLinks(links, platform, maxLinks);
};

const fetchSearchLinks = async ({ query, platformId, maxLinks }) => {
  const platform = getPlatformConfig(platformId);
  if (!platform) {
    return [];
  }

  const providerResults = await Promise.allSettled([
    fetchYahooShoppingAmazonLinks({ query, platform, maxLinks }),
    fetchYahooSearchLinks({ query, platform, maxLinks }),
    fetchBraveSearchLinks({ query, platform, maxLinks }),
    fetchDuckDuckGoLinks({ query, platform, maxLinks }),
    fetchNativePlatformLinks({ query, platform, maxLinks }),
  ]);

  const combinedLinks = [];
  providerResults.forEach((result) => {
    if (result.status === "fulfilled" && Array.isArray(result.value)) {
      combinedLinks.push(...result.value);
    }
  });

  return buildUniqueUrls(combinedLinks, maxLinks);
};

const fetchPageViaJina = async (targetUrl) => {
  try {
    const url = new URL(targetUrl);
    const jinaUrl = `https://r.jina.ai/http://${url.host}${url.pathname}${url.search}`;

    const response = await axios.get(jinaUrl, {
      timeout: PAGE_TIMEOUT_MS,
      headers: buildRequestHeaders(),
      validateStatus: (status) => status >= 200 && status < 500,
    });

    if (response.status >= 400) {
      return null;
    }

    return String(response.data || "");
  } catch {
    return null;
  }
};

const fetchPageContent = async (targetUrl) => {
  try {
    const directResponse = await axios.get(targetUrl, {
      timeout: PAGE_TIMEOUT_MS,
      headers: buildRequestHeaders(),
      maxRedirects: 4,
      validateStatus: (status) => status >= 200 && status < 500,
    });

    if (directResponse.status < 400 && directResponse.data) {
      return {
        html: String(directResponse.data),
        source: "direct",
      };
    }
  } catch {
    // Use fallback below.
  }

  const jinaData = await fetchPageViaJina(targetUrl);
  if (!jinaData) {
    return null;
  }

  return {
    html: jinaData,
    source: "jina",
  };
};

const runWithConcurrency = async (tasks, limit, worker) => {
  const results = [];
  let pointer = 0;

  const runners = new Array(Math.max(limit, 1)).fill(null).map(async () => {
    while (pointer < tasks.length) {
      const current = pointer;
      pointer += 1;

      try {
        const result = await worker(tasks[current], current);
        results[current] = result;
      } catch {
        results[current] = null;
      }
    }
  });

  await Promise.all(runners);

  return results.filter(Boolean);
};

const dedupeListings = (listings) => {
  const map = new Map();

  listings.forEach((listing) => {
    const titleKey = buildCanonicalTitleKey(listing.title);
    const dedupeKey = `${listing.platform.toLowerCase()}|${titleKey}`;
    const existing = map.get(dedupeKey);

    if (!existing) {
      map.set(dedupeKey, listing);
      return;
    }

    if (listing.score > existing.score) {
      map.set(dedupeKey, listing);
      return;
    }

    if (listing.score === existing.score && listing.price < existing.price) {
      map.set(dedupeKey, listing);
    }
  });

  return Array.from(map.values());
};

const pickBestPerPlatform = (listings) => {
  const map = new Map();

  listings.forEach((listing) => {
    const key = listing.platform.toLowerCase();
    const current = map.get(key);

    if (!current) {
      map.set(key, listing);
      return;
    }

    if (listing.score > current.score) {
      map.set(key, listing);
      return;
    }

    if (listing.score === current.score && listing.price < current.price) {
      map.set(key, listing);
    }
  });

  return Array.from(map.values());
};

const applyPriceFilters = (items, minPrice, maxPrice) => {
  return items.filter((item) => {
    if (minPrice !== null && item.price < minPrice) {
      return false;
    }

    if (maxPrice !== null && item.price > maxPrice) {
      return false;
    }

    return true;
  });
};

const sortByPrice = (items, sortOrder) => {
  const sorted = [...items];

  sorted.sort((first, second) => {
    if (sortOrder === "high-low") {
      return second.price - first.price;
    }

    return first.price - second.price;
  });

  return sorted;
};

const hasCompatibleNumericTokens = (targetText, candidateTitle) => {
  const targetNumbers = tokenize(targetText).filter((token) =>
    /\d/.test(token),
  );

  if (targetNumbers.length === 0) {
    return true;
  }

  const candidateTokenSet = new Set(tokenize(candidateTitle));
  return targetNumbers.every((token) => candidateTokenSet.has(token));
};

const ACCESSORY_TOKENS = new Set([
  "case",
  "cover",
  "charger",
  "cable",
  "protector",
  "tempered",
  "glass",
  "adapter",
  "headphone",
  "earphone",
  "earbuds",
  "skin",
  "backcover",
  "back",
]);

const PHONE_INTENT_TOKENS = new Set([
  "iphone",
  "phone",
  "smartphone",
  "mobile",
]);

const isAccessoryTitle = (title) => {
  const titleTokens = tokenize(title);
  return titleTokens.some((token) => ACCESSORY_TOKENS.has(token));
};

const resolveListingForUrl = async ({ url, platformId, targetText }) => {
  const pageData = await fetchPageContent(url);
  if (!pageData) {
    return null;
  }

  const listing = extractProductFromDocument({
    url,
    platformId,
    html: pageData.html,
    targetText,
    source: pageData.source,
  });

  if (!listing) {
    return null;
  }

  return listing;
};

const fetchPlatformCandidates = async ({
  searchText,
  targetText,
  platformId,
  maxLinks,
}) => {
  const links = await fetchSearchLinks({
    query: searchText,
    platformId,
    maxLinks,
  });

  if (links.length === 0) {
    return [];
  }

  const listings = await runWithConcurrency(
    links,
    FETCH_CONCURRENCY,
    async (url) => {
      await sleep(80);
      return resolveListingForUrl({
        url,
        platformId,
        targetText,
      });
    },
  );

  return listings.filter(Boolean);
};

const compareProducts = async ({
  query,
  platforms,
  minPrice,
  maxPrice,
  sort,
}) => {
  const rawQuery = String(query || "").trim();

  if (isInvalidSearchQuery(rawQuery)) {
    return [];
  }

  const selectedPlatformIds = resolvePlatformIds(platforms);
  const sortOrder = normalizeSortValue(sort);

  const minPriceValue = parsePriceNumber(minPrice);
  const maxPriceValue = parsePriceNumber(maxPrice);

  const cacheKey = buildCacheKey({
    query: rawQuery,
    platforms: selectedPlatformIds,
    minPrice: minPriceValue,
    maxPrice: maxPriceValue,
    sort: sortOrder,
  });

  const cached = getCachedValue(cacheKey);
  if (cached) {
    return cached;
  }

  const urlQuery = coerceToHttpUrl(rawQuery);
  const detectedPlatformId = urlQuery
    ? detectPlatformIdFromUrl(urlQuery)
    : null;
  const parsedUrlSearchText = urlQuery ? parseSearchTextFromUrl(urlQuery) : "";

  const seedListing =
    urlQuery && detectedPlatformId
      ? await resolveListingForUrl({
          url: urlQuery,
          platformId: detectedPlatformId,
          targetText: rawQuery,
        })
      : null;

  const targetText = seedListing?.title || parsedUrlSearchText || rawQuery;
  const searchText = seedListing?.title || parsedUrlSearchText || rawQuery;

  const candidateGroups = await Promise.all(
    selectedPlatformIds.map(async (platformId) => {
      const platform = PLATFORM_CONFIGS[platformId];
      if (!platform) {
        return [];
      }

      if (urlQuery && detectedPlatformId === platformId && seedListing) {
        return [seedListing];
      }

      return fetchPlatformCandidates({
        searchText,
        targetText,
        platformId,
        maxLinks: LINKS_PER_PLATFORM,
      });
    }),
  );

  const candidates = candidateGroups.flat();

  const queryTokens = tokenize(targetText);
  const accessoryIntent = queryTokens.some((token) =>
    ACCESSORY_TOKENS.has(token),
  );
  const phoneIntent = queryTokens.some((token) =>
    PHONE_INTENT_TOKENS.has(token),
  );

  const intentFiltered = candidates.filter((candidate) => {
    if (!accessoryIntent && isAccessoryTitle(candidate.title)) {
      return false;
    }

    if (phoneIntent && candidate.price < 1000) {
      return false;
    }

    return true;
  });

  const numericCompatible = intentFiltered.filter((candidate) =>
    hasCompatibleNumericTokens(targetText, candidate.title),
  );

  const scoredCandidates = numericCompatible.map((candidate) => ({
    candidate,
    score: similarityScore(targetText, candidate.title),
  }));

  const strictThreshold = urlQuery ? 0.2 : 0.12;
  const looseThreshold = urlQuery ? 0.12 : 0.05;

  const thresholded = scoredCandidates
    .filter((entry) => entry.score >= strictThreshold)
    .map((entry) => entry.candidate);

  const looseMatches = scoredCandidates
    .filter((entry) => entry.score >= looseThreshold)
    .map((entry) => entry.candidate);

  const fallbackCandidates =
    thresholded.length > 0 ? thresholded : looseMatches;
  const deduped = dedupeListings(fallbackCandidates);
  const platformBest = pickBestPerPlatform(deduped);

  const priceFiltered = applyPriceFilters(
    platformBest,
    minPriceValue,
    maxPriceValue,
  );
  const sorted = sortByPrice(priceFiltered, sortOrder);

  const normalized = sorted.map((item) => ({
    title: item.title,
    price: item.price,
    platform: item.platform,
    url: item.url,
    image: item.image,
  }));

  setCachedValue(cacheKey, normalized);
  return normalized;
};

module.exports = {
  compareProducts,
  getSupportedPlatforms,
};
