import React, { useState, useCallback, useMemo } from "react";
import {
  Play,
  Search,
  Loader,
  X,
  Music,
  Video,
  ExternalLink,
  Eye,
  Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * YouTube Music & Video Card Component
 * Replaces the Web Development card with YouTube search and video player functionality
 */
export default function YouTubeMusicCard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoPlayerOpen, setVideoPlayerOpen] = useState(false);

  // Animation variants
  const cardVariants = useMemo(
    () => ({
      idle: { scale: 1, rotateY: 0 },
      hover: { scale: 1.02, rotateY: 2 },
    }),
    []
  );

  const modalVariants = useMemo(
    () => ({
      hidden: {
        opacity: 0,
        scale: 0.8,
        y: 50,
      },
      visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
          type: "spring",
          damping: 25,
          stiffness: 300,
        },
      },
      exit: {
        opacity: 0,
        scale: 0.8,
        y: -50,
        transition: {
          duration: 0.2,
        },
      },
    }),
    []
  );

  const videoPlayerVariants = useMemo(
    () => ({
      hidden: {
        opacity: 0,
        scale: 0.9,
      },
      visible: {
        opacity: 1,
        scale: 1,
        transition: {
          type: "spring",
          damping: 25,
          stiffness: 300,
        },
      },
    }),
    []
  );

  // Search YouTube videos
  const handleSearch = useCallback(
    async (e) => {
      e.preventDefault();
      if (!searchQuery.trim()) return;

      setLoading(true);
      setError("");
      setSearchResults([]);

      try {
        const response = await fetch(
          `http://localhost:5000/api/youtube/search?q=${encodeURIComponent(
            searchQuery
          )}&maxResults=12`
        );

        if (!response.ok) {
          throw new Error(`Search failed: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          setSearchResults(data.data || []);
          if (data.data.length === 0) {
            setError("No videos found. Try different keywords.");
          }
          // Show demo mode message if using fallback data
          if (data.source === "demo_data") {
            setError(
              `Demo Mode: ${
                data.note ||
                "Using sample videos. Enable YouTube API for live search."
              }`
            );
          }
        } else {
          setError(data.error || "Search failed");
        }
      } catch (err) {
        console.error("Search error:", err);
        setError("Failed to search videos. Make sure the server is running.");
      } finally {
        setLoading(false);
      }
    },
    [searchQuery]
  );

  // Open video player
  const handleVideoClick = useCallback((video) => {
    setSelectedVideo(video);
    setVideoPlayerOpen(true);
  }, []);

  // Close modal
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    setError("");
  }, []);

  // Close video player
  const closeVideoPlayer = useCallback(() => {
    setVideoPlayerOpen(false);
    setSelectedVideo(null);
  }, []);

  // Format duration
  const formatDuration = useCallback((duration) => {
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
  }, []);

  // Format view count
  const formatViewCount = useCallback((viewCount) => {
    if (!viewCount) return "0 views";
    const count = parseInt(viewCount);
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M views`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K views`;
    }
    return `${count} views`;
  }, []);

  return (
    <>
      {/* Main Card */}
      <motion.div
        variants={cardVariants}
        initial="idle"
        whileHover="hover"
        onClick={() => setIsModalOpen(true)}
        className="cursor-pointer bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 group"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-red-500/20 rounded-lg group-hover:bg-red-500/30 transition-colors">
            <div className="flex items-center gap-2">
              <Music size={20} className="text-red-400" />
              <Video size={20} className="text-red-400" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-white">
              Music & Videos
            </h3>
            <p className="text-sm text-white/60">Powered by YouTube</p>
          </div>
        </div>

        <p className="text-white/80 mb-4">
          Search and discover music videos, songs, and entertainment content
          from YouTube. Watch in our beautiful personalized player.
        </p>

        <div className="flex items-center gap-2 text-sm text-white/60">
          <Play size={16} />
          <span>Click to search & play</span>
        </div>
      </motion.div>

      {/* Search Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={closeModal}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900/95 backdrop-blur-md border border-white/20 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-500/20 rounded-lg">
                      <div className="flex items-center gap-1">
                        <Music size={18} className="text-red-400" />
                        <Video size={18} className="text-red-400" />
                      </div>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white">
                        YouTube Music & Videos
                      </h2>
                      <p className="text-sm text-white/60">
                        Search and discover content
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closeModal}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X size={20} className="text-white/60" />
                  </button>
                </div>

                {/* Search Bar */}
                <form onSubmit={handleSearch} className="mt-6 flex gap-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search for music, videos, artists..."
                      className="w-full p-4 pl-12 rounded-xl bg-white/10 text-white placeholder-white/60 border border-white/20 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/20"
                      autoFocus
                    />
                    <Search
                      size={20}
                      className="absolute left-4 top-4 text-white/60"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!searchQuery.trim() || loading}
                    className="px-6 py-4 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 disabled:cursor-not-allowed rounded-xl text-white font-medium transition-colors flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader size={18} className="animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search size={18} />
                        Search
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                {error && (
                  <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
                    <p className="text-red-300">{error}</p>
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {searchResults.map((video) => (
                      <motion.div
                        key={video.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => handleVideoClick(video)}
                        className="bg-white/5 rounded-xl overflow-hidden cursor-pointer hover:bg-white/10 transition-all duration-200 group"
                      >
                        <div className="relative">
                          <img
                            src={
                              video.thumbnail.medium || video.thumbnail.default
                            }
                            alt={video.title}
                            className="w-full h-40 object-cover"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                            <div className="bg-black/50 backdrop-blur-sm rounded-full p-3 group-hover:scale-110 transition-transform">
                              <Play size={24} className="text-white ml-1" />
                            </div>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="text-white font-medium line-clamp-2 text-sm mb-2">
                            {video.title}
                          </h3>
                          <p className="text-white/60 text-xs mb-2 line-clamp-1">
                            {video.channelTitle}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-white/50">
                            <div className="flex items-center gap-1">
                              <Eye size={12} />
                              <span>Views</span>
                            </div>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <Clock size={12} />
                              <span>
                                {new Date(
                                  video.publishedAt
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {!loading &&
                  !error &&
                  searchResults.length === 0 &&
                  searchQuery && (
                    <div className="text-center py-12">
                      <Music size={48} className="text-white/30 mx-auto mb-4" />
                      <p className="text-white/60">
                        No results found. Try different keywords.
                      </p>
                    </div>
                  )}

                {!searchQuery && (
                  <div className="text-center py-12">
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <Music size={48} className="text-red-400/50" />
                      <Video size={48} className="text-red-400/50" />
                    </div>
                    <p className="text-white/60 text-lg mb-2">
                      Search for Music & Videos
                    </p>
                    <p className="text-white/40">
                      Enter keywords to discover content from YouTube
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Player Modal */}
      <AnimatePresence>
        {videoPlayerOpen && selectedVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-60 flex items-center justify-center p-4"
            onClick={closeVideoPlayer}
          >
            <motion.div
              variants={videoPlayerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900/95 backdrop-blur-md border border-white/20 rounded-2xl w-full max-w-6xl overflow-hidden"
            >
              {/* Player Header */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium truncate">
                    {selectedVideo.title}
                  </h3>
                  <p className="text-white/60 text-sm truncate">
                    {selectedVideo.channelTitle}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={selectedVideo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    title="Open in YouTube"
                  >
                    <ExternalLink size={18} className="text-white/60" />
                  </a>
                  <button
                    onClick={closeVideoPlayer}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X size={18} className="text-white/60" />
                  </button>
                </div>
              </div>

              {/* Video Player */}
              <div className="aspect-video">
                <iframe
                  src={selectedVideo.embedUrl}
                  title={selectedVideo.title}
                  className="w-full h-full"
                  allowFullScreen
                  allow="autoplay; encrypted-media"
                  frameBorder="0"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
