/**
 * Shopping Search Service
 * Fetches product search results from the backend shopping API.
 */

const API_BASE = (import.meta.env.VITE_API_BASE || "").trim();
const REQUEST_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS || 12000);

const getApiOrigin = () => {
  if (API_BASE) {
    return API_BASE.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "http://localhost:5000";
};

const buildApiUrl = (path, query = {}) => {
  const url = new URL(path, getApiOrigin());

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.append(key, String(value));
    }
  });

  return url;
};

const createRequestController = (timeoutMs = REQUEST_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  return {
    signal: controller.signal,
    cleanup: () => clearTimeout(timer),
  };
};

class ShoppingService {
  async request(path, query = {}) {
    const url = buildApiUrl(path, query);
    const { signal, cleanup } = createRequestController();

    try {
      const response = await fetch(url.toString(), { signal });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          payload?.error || `Request failed (${response.status})`,
        );
      }

      if (!payload || payload.success === false) {
        throw new Error(payload?.error || "Unexpected API response");
      }

      return payload;
    } finally {
      cleanup();
    }
  }

  async post(path, body = {}) {
    const url = buildApiUrl(path);
    const { signal, cleanup } = createRequestController();

    try {
      const response = await fetch(url.toString(), {
        method: "POST",
        signal,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          payload?.error || `Request failed (${response.status})`,
        );
      }

      return payload;
    } finally {
      cleanup();
    }
  }

  async compareProducts(options = {}) {
    const {
      query = "",
      platforms,
      minPrice,
      maxPrice,
      sort = "low-high",
    } = options;

    const payload = await this.post("/api/compare", {
      query,
      platforms,
      minPrice,
      maxPrice,
      sort,
    });

    return Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
        ? payload.data
        : [];
  }

  async getComparePlatforms() {
    const payload = await this.request("/api/compare/platforms");
    return Array.isArray(payload?.data?.platforms)
      ? payload.data.platforms
      : [];
  }

  async searchProducts(options = {}) {
    const {
      query = "",
      category = "all",
      brand = "all",
      minPrice,
      maxPrice,
      minRating,
      sortBy = "relevance",
      page = 1,
      limit = 24,
      includeOutOfStock = false,
    } = options;

    const payload = await this.request("/api/shopping/search", {
      q: query,
      category,
      brand,
      minPrice,
      maxPrice,
      minRating,
      sortBy,
      page,
      limit,
      includeOutOfStock,
    });

    const data = payload.data || {};

    return {
      items: Array.isArray(data.items) ? data.items : [],
      facets: data.facets || { categories: [], brands: [] },
      summary: data.summary || {
        totalResults: 0,
        totalPages: 1,
        page: 1,
        limit,
        priceRangeInr: null,
      },
      correction: data.correction || null,
      source: payload.source || data.source || "shopping_api",
      note: payload.note || data.note || "",
    };
  }
}

export default new ShoppingService();
