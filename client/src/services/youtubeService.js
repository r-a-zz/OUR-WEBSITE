/**
 * YouTube API Service
 * Handles all YouTube Data API v3 interactions
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

class YouTubeService {
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

  normalizeSearchItem(item) {
    if (item?.id && item?.snippet) {
      return this.formatSearchResults([item])[0];
    }

    const id = item?.id || "";
    return {
      id,
      type: item?.type || "video",
      title: item?.title || "",
      description: item?.description || "",
      thumbnail: item?.thumbnail || {},
      channelTitle: item?.channelTitle || "",
      channelId: item?.channelId || "",
      publishedAt: item?.publishedAt || "",
      url: item?.url || this.getVideoUrl(id),
      embedUrl: item?.embedUrl || this.getEmbedUrl(id),
    };
  }

  normalizeVideoItem(item) {
    if (item?.id && item?.snippet) {
      return this.formatVideoDetails(item);
    }

    const id = item?.id || "";
    return {
      id,
      title: item?.title || "",
      description: item?.description || "",
      thumbnail: item?.thumbnail || {},
      channelTitle: item?.channelTitle || "",
      channelId: item?.channelId || "",
      publishedAt: item?.publishedAt || "",
      duration: item?.duration || "",
      viewCount: item?.viewCount || "0",
      likeCount: item?.likeCount || "0",
      commentCount: item?.commentCount || "0",
      url: item?.url || this.getVideoUrl(id),
      embedUrl: item?.embedUrl || this.getEmbedUrl(id),
    };
  }

  /**
   * Search for videos on YouTube
   * @param {string} query - Search query
   * @param {number} maxResults - Maximum number of results (default: 10)
   * @param {string} type - Type of content (video, channel, playlist)
   * @returns {Promise<{items:Array, source:string, note:string}>}
   */
  async searchVideos(query, maxResults = 10, type = "video") {
    if (!query || !query.trim()) {
      return { items: [], source: "client_validation", note: "" };
    }

    const payload = await this.request("/api/youtube/search", {
      q: query.trim(),
      maxResults,
      type,
    });

    const items = Array.isArray(payload.data) ? payload.data : [];

    return {
      items: items.map((item) => this.normalizeSearchItem(item)),
      source: payload.source || "youtube_api",
      note: payload.note || "",
    };
  }

  /**
   * Get video details by ID
   * @param {string} videoId - YouTube video ID
   * @returns {Promise<Object>} Video details
   */
  async getVideoDetails(videoId) {
    if (!videoId) {
      throw new Error("Video ID is required");
    }

    const payload = await this.request(
      `/api/youtube/video/${encodeURIComponent(videoId)}`,
    );

    if (!payload.data) {
      throw new Error("Video not found");
    }

    return this.normalizeVideoItem(payload.data);
  }

  /**
   * Format search results for consistent structure
   * @param {Array} items - Raw YouTube API results
   * @returns {Array} Formatted results
   */
  formatSearchResults(items) {
    return items.map((item) => ({
      id: item.id.videoId || item.id.channelId || item.id.playlistId,
      type: item.id.kind?.replace("youtube#", "") || "video",
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: {
        default: item.snippet.thumbnails.default?.url,
        medium: item.snippet.thumbnails.medium?.url,
        high: item.snippet.thumbnails.high?.url,
        maxres: item.snippet.thumbnails.maxres?.url,
      },
      channelTitle: item.snippet.channelTitle,
      channelId: item.snippet.channelId,
      publishedAt: item.snippet.publishedAt,
      url: this.getVideoUrl(item.id.videoId),
      embedUrl: this.getEmbedUrl(item.id.videoId),
    }));
  }

  /**
   * Format video details
   * @param {Object} item - Raw YouTube video item
   * @returns {Object} Formatted video details
   */
  formatVideoDetails(item) {
    return {
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: {
        default: item.snippet.thumbnails.default?.url,
        medium: item.snippet.thumbnails.medium?.url,
        high: item.snippet.thumbnails.high?.url,
        maxres: item.snippet.thumbnails.maxres?.url,
      },
      channelTitle: item.snippet.channelTitle,
      channelId: item.snippet.channelId,
      publishedAt: item.snippet.publishedAt,
      duration: item.contentDetails?.duration,
      viewCount: item.statistics?.viewCount,
      likeCount: item.statistics?.likeCount,
      commentCount: item.statistics?.commentCount,
      url: this.getVideoUrl(item.id),
      embedUrl: this.getEmbedUrl(item.id),
    };
  }

  /**
   * Get YouTube video URL
   * @param {string} videoId - Video ID
   * @returns {string} Full YouTube URL
   */
  getVideoUrl(videoId) {
    return `https://www.youtube.com/watch?v=${videoId}`;
  }

  /**
   * Get YouTube embed URL
   * @param {string} videoId - Video ID
   * @returns {string} YouTube embed URL
   */
  getEmbedUrl(videoId) {
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
  }

  /**
   * Parse duration from YouTube format (PT4M13S) to readable format
   * @param {string} duration - YouTube duration format
   * @returns {string} Human readable duration
   */
  parseDuration(duration) {
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
  }

  /**
   * Format view count to readable format
   * @param {string|number} viewCount - View count
   * @returns {string} Formatted view count
   */
  formatViewCount(viewCount) {
    if (!viewCount) return "0 views";

    const count = Number.parseInt(viewCount, 10);

    if (Number.isNaN(count)) {
      return "0 views";
    }

    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M views`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K views`;
    }
    return `${count} views`;
  }
}

export default new YouTubeService();
