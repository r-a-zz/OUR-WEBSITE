import React, { useCallback, useMemo, useRef, useState } from "react";
import { motion as Motion } from "framer-motion";
import {
  AlertCircle,
  ExternalLink,
  Loader2,
  Search,
  ShoppingBag,
  SlidersHorizontal,
} from "lucide-react";
import shoppingService from "../../services/shoppingService";

const DEFAULT_PLATFORMS = [
  { id: "amazon", name: "Amazon" },
  { id: "flipkart", name: "Flipkart" },
  { id: "myntra", name: "Myntra" },
  { id: "ajio", name: "Ajio" },
  { id: "croma", name: "Croma" },
  { id: "reliancedigital", name: "Reliance Digital" },
];

const SORT_OPTIONS = [
  { value: "low-high", label: "Price: Low to High" },
  { value: "high-low", label: "Price: High to Low" },
];

const buildDefaultPlatformState = (platforms) => {
  return platforms.reduce((accumulator, platform) => {
    accumulator[platform.id] = [
      "amazon",
      "flipkart",
      "myntra",
      "ajio",
    ].includes(platform.id);
    return accumulator;
  }, {});
};

const formatInr = (value) => {
  if (!Number.isFinite(value)) {
    return "-";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
};

const isPlaceholderQuery = (value) => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  return ["", "undefined", "null", "nan"].includes(normalized);
};

const ShoppingComparePage = () => {
  const [queryInput, setQueryInput] = useState("");
  const [results, setResults] = useState([]);
  const [platforms] = useState(DEFAULT_PLATFORMS);
  const [platformSelection, setPlatformSelection] = useState(
    buildDefaultPlatformState(DEFAULT_PLATFORMS),
  );
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("low-high");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const requestIdRef = useRef(0);

  const selectedPlatformIds = useMemo(
    () =>
      Object.entries(platformSelection)
        .filter(([, enabled]) => Boolean(enabled))
        .map(([platformId]) => platformId),
    [platformSelection],
  );

  const runCompare = useCallback(async () => {
    const query = queryInput.trim();

    if (isPlaceholderQuery(query)) {
      setError("Enter a valid product name or product URL before searching.");
      setResults([]);
      setHasSearched(true);
      return;
    }

    if (selectedPlatformIds.length === 0) {
      setError("Select at least one platform.");
      setResults([]);
      setHasSearched(true);
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setIsLoading(true);
    setError("");

    try {
      const compared = await shoppingService.compareProducts({
        query,
        platforms: selectedPlatformIds,
        minPrice,
        maxPrice,
        sort: sortBy,
      });

      if (requestId !== requestIdRef.current) {
        return;
      }

      setResults(Array.isArray(compared) ? compared : []);
      setHasSearched(true);
    } catch (compareError) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      setResults([]);
      setHasSearched(true);
      setError(compareError.message || "Failed to compare products right now.");
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [maxPrice, minPrice, queryInput, selectedPlatformIds, sortBy]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await runCompare();
  };

  const togglePlatform = (platformId) => {
    setPlatformSelection((previous) => ({
      ...previous,
      [platformId]: !previous[platformId],
    }));
  };

  return (
    <div className="space-y-8 sm:space-y-10">
      <Motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white">
          Shopping Compare
        </h1>
        <p className="mt-4 text-white/80 max-w-3xl mx-auto text-base sm:text-lg leading-relaxed">
          Compare the same or similar product across multiple platforms with
          real links, normalized pricing, and sortable results.
        </p>
      </Motion.div>

      <Motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06, duration: 0.5 }}
        className="rounded-3xl border border-pink-500/30 bg-pink-900/10 p-5 sm:p-6"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-200/70"
            />
            <input
              type="text"
              value={queryInput}
              onChange={(event) => setQueryInput(event.target.value)}
              placeholder="Search product name or paste product URL"
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-black/35 border border-pink-500/30 text-white placeholder-white/40 focus:outline-none focus:border-pink-300"
            />
          </div>

          <div className="rounded-2xl border border-cyan-500/25 bg-cyan-900/10 p-4">
            <div className="flex items-center gap-2 text-cyan-200 mb-3">
              <SlidersHorizontal size={16} />
              <p className="font-semibold text-white">Filters</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="number"
                min="0"
                value={minPrice}
                onChange={(event) => setMinPrice(event.target.value)}
                placeholder="Min price (optional)"
                className="px-3 py-2.5 rounded-xl bg-black/35 border border-cyan-500/30 text-white placeholder-white/40"
              />

              <input
                type="number"
                min="0"
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
                placeholder="Max price (optional)"
                className="px-3 py-2.5 rounded-xl bg-black/35 border border-cyan-500/30 text-white placeholder-white/40"
              />

              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="px-3 py-2.5 rounded-xl bg-black/35 border border-cyan-500/30 text-white"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {platforms.map((platform) => (
                <label
                  key={platform.id}
                  className="inline-flex items-center gap-2 px-2.5 py-2 rounded-lg border border-cyan-500/25 bg-black/25 text-sm text-cyan-100"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(platformSelection[platform.id])}
                    onChange={() => togglePlatform(platform.id)}
                  />
                  <span>{platform.name}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-violet-600 text-white font-semibold hover:brightness-110 transition-all duration-200 disabled:opacity-70"
          >
            {isLoading ? "Comparing..." : "Compare Prices"}
          </button>
        </form>
      </Motion.section>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-900/15 p-4 text-red-200">
          <AlertCircle size={16} className="inline mr-2" />
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-white/70">
          <Loader2 size={20} className="inline animate-spin mr-2" />
          Fetching and normalizing listings from selected platforms...
        </div>
      ) : hasSearched && results.length === 0 && !error ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-white/70">
          No comparable listings found for this query. Try a broader product
          name or adjust filters.
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {results.map((item) => (
            <Motion.article
              key={`${item.platform}-${item.url}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-3xl border border-pink-500/20 bg-black/30 overflow-hidden"
            >
              <div className="aspect-[16/10] overflow-hidden bg-black/40">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/50 text-sm">
                    Image unavailable
                  </div>
                )}
              </div>

              <div className="p-4 space-y-3">
                <p className="inline-flex items-center gap-1 text-xs text-cyan-100 rounded-full border border-cyan-500/25 px-2 py-1">
                  <ShoppingBag size={12} />
                  {item.platform}
                </p>

                <h3 className="text-lg font-semibold text-white leading-snug line-clamp-2">
                  {item.title}
                </h3>

                <p className="text-2xl font-bold text-emerald-300">
                  {formatInr(Number(item.price))}
                </p>

                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-cyan-500/30 text-cyan-100 hover:bg-cyan-500/10 text-sm"
                >
                  View on {item.platform}
                  <ExternalLink size={13} />
                </a>
              </div>
            </Motion.article>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default ShoppingComparePage;
