const INVALID_LITERAL_QUERY_VALUES = new Set([
  "undefined",
  "null",
  "nan",
  "none",
]);

const normalizeText = (value = "") =>
  String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokenize = (value = "") =>
  normalizeText(value)
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean);

const isInvalidSearchQuery = (query = "") => {
  const normalized = normalizeText(query);

  if (!normalized) {
    return true;
  }

  return INVALID_LITERAL_QUERY_VALUES.has(normalized);
};

const parsePriceNumber = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const raw = String(value || "");
  if (!raw) {
    return null;
  }

  const cleaned = raw
    .replace(/₹|rs\.?|inr/gi, "")
    .replace(/[^0-9,\.]/g, "")
    .trim();

  if (!cleaned) {
    return null;
  }

  const normalized =
    cleaned.includes(",") && cleaned.includes(".")
      ? cleaned.replace(/,/g, "")
      : cleaned.replace(/,/g, "");

  const parsed = Number.parseFloat(normalized);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  if (parsed < 1 || parsed > 10000000) {
    return null;
  }

  return Math.round(parsed);
};

const buildCanonicalTitleKey = (title = "") => {
  const stopWords = new Set([
    "with",
    "for",
    "the",
    "and",
    "in",
    "on",
    "by",
    "of",
    "new",
    "latest",
    "best",
    "buy",
  ]);

  return tokenize(title)
    .filter((token) => token.length > 1 && !stopWords.has(token))
    .slice(0, 10)
    .join(" ");
};

const similarityScore = (sourceText = "", targetText = "") => {
  const sourceTokens = tokenize(sourceText);
  const targetTokens = tokenize(targetText);

  if (sourceTokens.length === 0 || targetTokens.length === 0) {
    return 0;
  }

  const sourceSet = new Set(sourceTokens);
  const targetSet = new Set(targetTokens);

  let intersection = 0;
  sourceSet.forEach((token) => {
    if (targetSet.has(token)) {
      intersection += 1;
    }
  });

  const union = new Set([...sourceSet, ...targetSet]).size;
  if (union === 0) {
    return 0;
  }

  let score = intersection / union;

  const normalizedSource = sourceTokens.join(" ");
  const normalizedTarget = targetTokens.join(" ");

  if (normalizedTarget.includes(normalizedSource)) {
    score += 0.25;
  }

  if (normalizedSource.includes(normalizedTarget)) {
    score += 0.1;
  }

  return Math.min(1, Number(score.toFixed(4)));
};

const coerceToHttpUrl = (query = "") => {
  const raw = String(query || "").trim();

  if (!raw) {
    return null;
  }

  if (/^https?:\/\//i.test(raw)) {
    try {
      return new URL(raw).toString();
    } catch {
      return null;
    }
  }

  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/|$)/i.test(raw)) {
    try {
      return new URL(`https://${raw}`).toString();
    } catch {
      return null;
    }
  }

  return null;
};

const sanitizeImageUrl = (value) => {
  const raw = String(value || "").trim();

  if (!raw) {
    return "";
  }

  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  if (raw.startsWith("//")) {
    return `https:${raw}`;
  }

  return "";
};

module.exports = {
  normalizeText,
  tokenize,
  isInvalidSearchQuery,
  parsePriceNumber,
  buildCanonicalTitleKey,
  similarityScore,
  coerceToHttpUrl,
  sanitizeImageUrl,
};
