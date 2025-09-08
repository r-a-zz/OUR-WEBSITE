const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// YouTube API Configuration (require env var for safety)
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_BASE_URL = "https://www.googleapis.com/youtube/v3";

if (!YOUTUBE_API_KEY) {
  console.error("FATAL: Missing required environment variable YOUTUBE_API_KEY. Set it in server/.env or your environment.");
  process.exit(1);
}

app.use(cors());
app.use(express.json());

// Note: MongoDB is disabled for this project
// The server runs without database and focuses on YouTube API functionality
console.log("🚀 Server starting without database connection...");

// YouTube API Helper Functions
const formatSearchResults = (items) => {
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
    url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    embedUrl: `https://www.youtube.com/embed/${item.id.videoId}?autoplay=1&rel=0&modestbranding=1`,
  }));
};

const formatVideoDetails = (item) => {
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
    url: `https://www.youtube.com/watch?v=${item.id}`,
    embedUrl: `https://www.youtube.com/embed/${item.id}?autoplay=1&rel=0&modestbranding=1`,
  };
};

const parseDuration = (duration) => {
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
};

const formatViewCount = (viewCount) => {
  if (!viewCount) return "0 views";

  const count = parseInt(viewCount);
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M views`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K views`;
  }
  return `${count} views`;
};

// YouTube API Routes

// Mock data for demo purposes when API is not available
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
    url: "https://www.youtube.com/watch?v=YQHsXMglC9A",
    embedUrl:
      "https://www.youtube.com/embed/YQHsXMglC9A?autoplay=1&rel=0&modestbranding=1",
  },
];

// Search YouTube videos
app.get("/api/youtube/search", async (req, res) => {
  try {
    const { q, maxResults = 10, type = "video" } = req.query;

    if (!q || q.trim() === "") {
      return res.status(400).json({
        success: false,
        error: "Search query is required",
      });
    }

    // Try actual YouTube API first
    try {
      const response = await axios.get(`${YOUTUBE_API_BASE_URL}/search`, {
        params: {
          part: "snippet",
          q: q.trim(),
          type,
          maxResults: Math.min(parseInt(maxResults), 50), // Limit to 50 max
          key: YOUTUBE_API_KEY,
          order: "relevance",
          safeSearch: "moderate",
        },
      });

      const formattedResults = formatSearchResults(response.data.items || []);

      res.json({
        success: true,
        data: formattedResults,
        totalResults: response.data.pageInfo?.totalResults || 0,
        resultsPerPage: response.data.pageInfo?.resultsPerPage || 0,
        source: "youtube_api",
      });
    } catch (apiError) {
      console.log(
        "YouTube API not available, using demo data:",
        apiError.response?.data?.error?.message
      );

      // Fallback to mock data with search filtering
      const searchTerm = q.toLowerCase();
      const filteredResults = mockYouTubeData.filter(
        (video) =>
          video.title.toLowerCase().includes(searchTerm) ||
          video.description.toLowerCase().includes(searchTerm) ||
          video.channelTitle.toLowerCase().includes(searchTerm)
      );

      // If no matches, return all mock data
      const results =
        filteredResults.length > 0 ? filteredResults : mockYouTubeData;

      res.json({
        success: true,
        data: results.slice(0, parseInt(maxResults)),
        totalResults: results.length,
        resultsPerPage: results.length,
        source: "demo_data",
        note: "YouTube API not available. Enable YouTube Data API v3 in Google Cloud Console for live search.",
      });
    }
  } catch (error) {
    console.error("YouTube search error:", error.message);

    res.status(500).json({
      success: false,
      error: "Failed to search YouTube videos",
    });
  }
});

// Get YouTube video details
app.get("/api/youtube/video/:videoId", async (req, res) => {
  try {
    const { videoId } = req.params;

    if (!videoId) {
      return res.status(400).json({
        success: false,
        error: "Video ID is required",
      });
    }

    const response = await axios.get(`${YOUTUBE_API_BASE_URL}/videos`, {
      params: {
        part: "snippet,statistics,contentDetails",
        id: videoId,
        key: YOUTUBE_API_KEY,
      },
    });

    if (!response.data.items || response.data.items.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Video not found",
      });
    }

    const videoDetails = formatVideoDetails(response.data.items[0]);

    // Add formatted duration and view count
    videoDetails.formattedDuration = parseDuration(videoDetails.duration);
    videoDetails.formattedViewCount = formatViewCount(videoDetails.viewCount);

    res.json({
      success: true,
      data: videoDetails,
    });
  } catch (error) {
    console.error(
      "YouTube video details error:",
      error.response?.data || error.message
    );

    if (error.response?.status === 403) {
      res.status(403).json({
        success: false,
        error: "YouTube API quota exceeded or invalid API key",
      });
    } else if (error.response?.status === 404) {
      res.status(404).json({
        success: false,
        error: "Video not found",
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Failed to get video details",
      });
    }
  }
});

// Get trending videos
app.get("/api/youtube/trending", async (req, res) => {
  try {
    const { maxResults = 10, categoryId, regionCode = "US" } = req.query;

    const params = {
      part: "snippet,statistics",
      chart: "mostPopular",
      maxResults: Math.min(parseInt(maxResults), 50),
      regionCode,
      key: YOUTUBE_API_KEY,
    };

    if (categoryId) {
      params.videoCategoryId = categoryId;
    }

    const response = await axios.get(`${YOUTUBE_API_BASE_URL}/videos`, {
      params,
    });

    const formattedResults = response.data.items.map((item) => {
      const formatted = formatVideoDetails(item);
      formatted.formattedDuration = parseDuration(formatted.duration);
      formatted.formattedViewCount = formatViewCount(formatted.viewCount);
      return formatted;
    });

    res.json({
      success: true,
      data: formattedResults,
      totalResults: response.data.pageInfo?.totalResults || 0,
    });
  } catch (error) {
    console.error(
      "YouTube trending error:",
      error.response?.data || error.message
    );

    res.status(500).json({
      success: false,
      error: "Failed to get trending videos",
    });
  }
});

app.get("/api", (req, res) => {
  res.json({ message: "Gift API is running!" });
});

app.listen(PORT, () => {
  console.log(`Gift server running on port ${PORT}`);
});
