import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  ExternalLink,
  Shuffle,
  Heart,
  Sparkles,
  Gamepad2,
  Music,
  Globe,
  Wrench,
  Brain,
} from "lucide-react";
import YouTubeMusicCard from "../UI/YouTubeMusicCard.jsx";

const FAVORITES_STORAGE_KEY = "our-dreams-favorite-websites";

const DREAM_WEBSITES = [
  {
    id: "sandspiel",
    name: "Sandspiel",
    url: "https://sandspiel.club/",
    purpose: "Creative sandbox website",
    category: "creative",
  },
  {
    id: "patatap",
    name: "Patatap",
    url: "https://patatap.com/",
    purpose: "Create random audiovisual sounds with your keyboard",
    category: "music",
  },
  {
    id: "emu-os",
    name: "EmuOS",
    url: "https://emupedia.net/beta/emuos/",
    purpose: "Free and legal old-school browser game experience",
    category: "games",
  },
  {
    id: "classic-minecraft",
    name: "Classic Minecraft",
    url: "https://classic.minecraft.net/",
    purpose: "Play classic Minecraft in browser",
    category: "games",
  },
  {
    id: "online-sequencer",
    name: "Online Sequencer",
    url: "https://onlinesequencer.net/",
    purpose: "Create your own audio tracks online",
    category: "music",
  },
  {
    id: "venge",
    name: "Venge",
    url: "https://venge.io/",
    purpose: "Free multiplayer shooter game",
    category: "games",
  },
  {
    id: "slither",
    name: "Slither",
    url: "https://slither.io/",
    purpose: "Fun classic snake-style multiplayer game",
    category: "games",
  },
  {
    id: "playback-fm",
    name: "Playback.fm",
    url: "https://playback.fm/",
    purpose: "Find the #1 song on the day you were born",
    category: "music",
  },
  {
    id: "draw-a-stickman",
    name: "Draw a Stickman",
    url: "https://drawastickman.com/",
    purpose: "Interactive stickman drawing game",
    category: "creative",
  },
  {
    id: "virtual-vacation",
    name: "Virtual Vacation",
    url: "https://virtualvacation.us/",
    purpose: "Guess cities and countries with friends",
    category: "explore",
  },
  {
    id: "freddie-meter",
    name: "Freddie Meter",
    url: "https://freddiemeter.withyoutube.com/",
    purpose: "Check how much your voice resembles Freddie Mercury",
    category: "music",
  },
  {
    id: "personality-assessor",
    name: "Personality Assessor",
    url: "https://www.personalityassessor.com/",
    purpose: "Discover your personality profile",
    category: "mind",
  },
  {
    id: "geo-fs",
    name: "GeoFS",
    url: "https://www.geo-fs.com/",
    purpose: "Fly planes around the world in-browser",
    category: "explore",
  },
  {
    id: "hypnogram",
    name: "Hypnogram",
    url: "https://hypnogram.xyz/",
    purpose: "Generate AI images",
    category: "creative",
  },
  {
    id: "bored-humans",
    name: "Bored Humans",
    url: "https://boredhumans.com/",
    purpose: "Large collection of fun and weird tools",
    category: "utility",
  },
  {
    id: "slowroads",
    name: "Slowroads",
    url: "https://slowroads.io/",
    purpose: "Relaxing endless driving simulation",
    category: "games",
  },
  {
    id: "voice-ai",
    name: "Voice.ai",
    url: "https://voice.ai/",
    purpose: "Voice modulation and creative audio effects",
    category: "music",
  },
  {
    id: "radio-garden",
    name: "Radio Garden",
    url: "https://radio.garden/",
    purpose: "Listen to radio stations from around the world",
    category: "explore",
  },
];

const CATEGORY_CONFIG = {
  all: { label: "All", icon: Sparkles },
  games: { label: "Games", icon: Gamepad2 },
  music: { label: "Music", icon: Music },
  creative: { label: "Creative", icon: Sparkles },
  explore: { label: "Explore", icon: Globe },
  utility: { label: "Useful", icon: Wrench },
  mind: { label: "Mind", icon: Brain },
};

const ServicesPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setFavorites(parsed);
      }
    } catch {
      setFavorites([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const categories = useMemo(() => {
    const unique = new Set(DREAM_WEBSITES.map((site) => site.category));
    return ["all", ...Array.from(unique)];
  }, []);

  const filteredWebsites = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();

    return DREAM_WEBSITES.filter((site) => {
      const categoryMatch =
        activeCategory === "all" || site.category === activeCategory;

      const searchMatch =
        normalized.length === 0 ||
        site.name.toLowerCase().includes(normalized) ||
        site.purpose.toLowerCase().includes(normalized);

      return categoryMatch && searchMatch;
    });
  }, [activeCategory, searchTerm]);

  const toggleFavorite = useCallback((siteId) => {
    setFavorites((current) =>
      current.includes(siteId)
        ? current.filter((id) => id !== siteId)
        : [...current, siteId],
    );
  }, []);

  const openRandomWebsite = useCallback(() => {
    if (filteredWebsites.length === 0) {
      return;
    }

    const randomSite =
      filteredWebsites[Math.floor(Math.random() * filteredWebsites.length)];
    window.open(randomSite.url, "_blank", "noopener,noreferrer");
  }, [filteredWebsites]);

  return (
    <div className="space-y-16">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center"
      >
        <motion.h1
          className="text-5xl md:text-7xl font-bold text-white mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          Our Dreams Hub
        </motion.h1>
        <motion.p
          className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          A handpicked collection of cool websites for fun, music, creativity,
          and daily life hacks. Save your favorites and hit random when you are
          bored.
        </motion.p>
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.6 }}
        className="space-y-5"
      >
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60"
              size={18}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search websites by name or purpose..."
              className="w-full bg-white/10 border border-white/20 rounded-2xl py-3 pl-11 pr-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400/40"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={openRandomWebsite}
            disabled={filteredWebsites.length === 0}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Shuffle size={18} />
            Surprise Me
          </motion.button>
        </div>

        <div className="flex flex-wrap gap-3">
          {categories.map((category) => {
            const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.all;
            const Icon = config.icon;

            return (
              <motion.button
                key={category}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-300 flex items-center gap-2 ${
                  activeCategory === category
                    ? "bg-purple-500/30 border-purple-300/50 text-white"
                    : "bg-white/10 border-white/20 text-white/75 hover:bg-white/15"
                }`}
              >
                <Icon size={14} />
                {config.label}
              </motion.button>
            );
          })}
        </div>

        <div className="text-white/60 text-sm">
          Showing {filteredWebsites.length} websites • {favorites.length} saved
        </div>
      </motion.div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {/* YouTube Music Card - Featured Service */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="md:col-span-2 xl:col-span-1"
        >
          <YouTubeMusicCard />
        </motion.div>

        {/* Curated Websites */}
        {filteredWebsites.map((site, index) => {
          const isFavorite = favorites.includes(site.id);
          const categoryLabel =
            CATEGORY_CONFIG[site.category]?.label || CATEGORY_CONFIG.all.label;

          return (
            <motion.div
              key={site.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + index * 0.1, duration: 0.8 }}
              whileHover={{
                y: -10,
                transition: { type: "spring", stiffness: 300, damping: 10 },
              }}
              className="group bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 relative overflow-hidden"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-purple-500/10 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                initial={{ scale: 0, rotate: 180 }}
                whileHover={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.6 }}
              />

              <div className="relative z-10">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="inline-flex items-center rounded-full border border-white/30 px-3 py-1 text-xs text-white/80 mb-3">
                      {categoryLabel}
                    </div>
                    <h3 className="text-2xl font-bold text-white group-hover:text-blue-300 transition-colors">
                      {site.name}
                    </h3>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.12 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleFavorite(site.id)}
                    className={`rounded-full p-2 border ${
                      isFavorite
                        ? "bg-pink-500/25 border-pink-300/50 text-pink-200"
                        : "bg-white/10 border-white/25 text-white/70"
                    }`}
                    aria-label={isFavorite ? "Remove favorite" : "Add favorite"}
                  >
                    <Heart
                      size={16}
                      fill={isFavorite ? "currentColor" : "none"}
                    />
                  </motion.button>
                </div>

                <p className="text-white/80 leading-relaxed mb-6">
                  {site.purpose}
                </p>

                <a
                  href={site.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold hover:shadow-lg transition-all duration-300"
                >
                  Open Website
                  <ExternalLink size={16} />
                </a>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredWebsites.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-white/70 bg-white/5 border border-white/10 rounded-2xl p-8"
        >
          No websites matched your search. Try another keyword or category.
        </motion.div>
      )}

      {/* Couple Workflow */}
      <motion.div
        className="bg-white/5 backdrop-blur-md rounded-3xl p-8 md:p-12 border border-white/10"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.8 }}
      >
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
          How We Use This Hub Together
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            {
              step: "01",
              title: "Pick a Mood",
              desc: "Choose category based on vibe: games, music, explore, or creative",
            },
            {
              step: "02",
              title: "Search Fast",
              desc: "Use search to jump directly to what we need in seconds",
            },
            {
              step: "03",
              title: "Save Favorites",
              desc: "Bookmark our best picks so we always come back to them",
            },
            {
              step: "04",
              title: "Surprise Mode",
              desc: "Use random pick when we are bored and want something new",
            },
          ].map((process, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6 + index * 0.2, duration: 0.6 }}
              className="text-center relative"
            >
              {/* Connection line */}
              {index < 3 && (
                <motion.div
                  className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 2 + index * 0.3, duration: 0.8 }}
                />
              )}

              <motion.div
                className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg relative z-10"
                whileHover={{ scale: 1.1, rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                {process.step}
              </motion.div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {process.title}
              </h3>
              <p className="text-white/70 text-sm">{process.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default ServicesPage;
