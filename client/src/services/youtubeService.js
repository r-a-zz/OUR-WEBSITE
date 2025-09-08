/**
 * YouTube API Service
 * Handles all YouTube Data API v3 interactions
 */

const YOUTUBE_API_KEY = "AIzaSyDVYNLILGqJ7hUf3FDjgUq1EseJEbxh7PA";
const YOUTUBE_API_BASE_URL = "https://www.googleapis.com/youtube/v3";

class YouTubeService {
  /**
   * Search for videos on YouTube
   * @param {string} query - Search query
   * @param {number} maxResults - Maximum number of results (default: 10)
   * @param {string} type - Type of content (video, channel, playlist)
   * @returns {Promise<Array>} Array of video results
   */
  async searchVideos(query, maxResults = 10, type = "video") {
    try {
      const url = new URL(`${YOUTUBE_API_BASE_URL}/search`);
      url.searchParams.append("part", "snippet");
      url.searchParams.append("q", query);
      url.searchParams.append("type", type);
      url.searchParams.append("maxResults", maxResults);
      url.searchParams.append("key", YOUTUBE_API_KEY);
      url.searchParams.append("order", "relevance");
      url.searchParams.append("safeSearch", "moderate");

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `YouTube API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      return this.formatSearchResults(data.items || []);
    } catch (error) {
      console.error("YouTube search error:", error);
      throw new Error("Failed to search YouTube. Please try again.");
    }
  }

  /**
   * Get video details by ID
   * @param {string} videoId - YouTube video ID
   * @returns {Promise<Object>} Video details
   */
  async getVideoDetails(videoId) {
    try {
      const url = new URL(`${YOUTUBE_API_BASE_URL}/videos`);
      url.searchParams.append("part", "snippet,statistics,contentDetails");
      url.searchParams.append("id", videoId);
      url.searchParams.append("key", YOUTUBE_API_KEY);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.items && data.items.length > 0) {
        return this.formatVideoDetails(data.items[0]);
      }

      throw new Error("Video not found");
    } catch (error) {
      console.error("YouTube video details error:", error);
      throw error;
    }
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

    const hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    const seconds = parseInt(match[3]) || 0;

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

    const count = parseInt(viewCount);
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M views`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K views`;
    }
    return `${count} views`;
  }
}

export default new YouTubeService();
