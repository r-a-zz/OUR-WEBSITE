import React, { useState, useRef, useEffect } from "react";
import { Music, Search, Loader } from "lucide-react";
import { useSpring, animated } from "@react-spring/web";

export default function MusicCard() {
  const [playing, setPlaying] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const inputRef = useRef(null);
  const audioRefs = useRef([]);

  // Improvement 1: Autofocus the search input when the card opens
  useEffect(() => {
    if (playing && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 300);
    }
  }, [playing]);

  const expand = useSpring({
    from: { height: 0, opacity: 0 },
    to: { height: playing ? 400 : 0, opacity: playing ? 1 : 0 },
    config: { tension: 220, friction: 26 },
  });

  const spin = useSpring({
    transform: playing ? "rotate(360deg) scale(1.05)" : "rotate(0deg) scale(1)",
    config: { duration: 700 },
  });

  async function handleSearch(e) {
    e.preventDefault();
    if (!search.trim()) return;
    setLoading(true);
    setError("");
    setResults([]);
    try {
      const response = await fetch(
        `http://localhost:5000/api/search?q=${encodeURIComponent(search)}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setResults(data.data || []);
      } else {
        setError(data.error || 'Search failed');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search. Make sure the server is running.');
    } finally {
      setLoading(false);
    }
  }

  // Improvement 2: Ensure only one song plays at a time
  const handlePlay = (e) => {
    audioRefs.current.forEach(audioEl => {
      if (audioEl && audioEl !== e.target) {
        audioEl.pause();
      }
    });
  };

  // Improvement 3: Consistent close logic
  const handleClose = (e) => {
    if (e) e.stopPropagation();
    setPlaying(false);
    // We wait for the animation to finish before clearing results for a smoother look
    setTimeout(() => {
        setSearch("");
        setResults([]);
        setError("");
    }, 400)
  };

  return (
    <div
      onClick={() => (playing ? handleClose() : setPlaying(true))}
      className={`cursor-pointer bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 transition-all duration-300 ${
        playing ? "shadow-2xl bg-white/15" : "hover:bg-white/15"
      }`}
      style={{ maxWidth: 500, margin: "0 auto" }}
    >
      <h3 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
        <animated.span style={spin} aria-hidden="true">
          <Music size={22} />
        </animated.span>
        Music Search
        <span className="ml-3 text-sm text-white/60">
          {playing ? "Search & Play" : "Tap to search music"}
        </span>
      </h3>
      <p className="text-white/80 mb-4">
        Search and discover music from around the world — powered by our backend API.
      </p>
      <animated.div style={{ overflow: "hidden", ...expand }}>
        <div className="mt-2 p-4 bg-white/5 rounded-lg border border-white/10">
          <form
            onClick={e => e.stopPropagation()}
            onSubmit={handleSearch}
            className="mb-4 flex gap-2"
          >
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search tracks, artists, albums..."
                className="w-full p-3 pl-10 rounded-md bg-white/10 text-white placeholder-white/60 border border-white/20 focus:border-blue-400 focus:outline-none"
              />
              <Search size={18} className="absolute left-3 top-3.5 text-white/60" />
            </div>
            <button
              type="submit"
              disabled={!search.trim() || loading}
              className="px-4 py-3 text-sm bg-blue-500 rounded-md text-white hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <><Loader size={16} className="animate-spin" /> Searching...</>
              ) : ( 'Search' )}
            </button>
          </form>

          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-medium text-white">Music Player</div>
              <div className="text-xs text-white/70">
                {results.length > 0 ? `${results.length} results found` : 'Enter a search term'}
              </div>
            </div>
            <button
              onClick={handleClose}
              className="px-3 py-1 text-sm bg-white/10 rounded-md hover:bg-white/20 transition"
            >
              Close
            </button>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-md">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}
          
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
            {results.map((track, index) => (
              <div
                key={track.id}
                className="p-3 bg-white/10 rounded-md flex items-center gap-4 hover:bg-white/15 transition"
              >
                <img
                  src={track.cover}
                  alt={track.title}
                  className="w-12 h-12 rounded object-cover flex-shrink-0"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjMzMzIiByeD0iNCIvPgo8cGF0aCBkPSJNMjQgMzJjNC40IDAgOC0zLjYgOC04cy0zLjYtOC04LTgtOCAzLjYtOCA4IDMuNiA4IDggOHptMC0xMmMzLjMgMCA2IDIuNyA2IDZzLTIuNyA2LTYgNi02LTIuNy02LTYgMi47LTYgNi02eiIgZmlsbD0iIzk5OSIvPgo8L3N2Zz4K';
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white text-sm truncate">{track.title}</div>
                  <div className="text-xs text-white/70 truncate">{track.artist} • {track.album}</div>
                </div>
                {track.preview && (
                  <audio
                    ref={el => audioRefs.current[index] = el}
                    onPlay={handlePlay}
                    controls
                    src={track.preview}
                    className="w-24 h-8"
                    preload="none"
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </animated.div>
    </div>
  );
}