const { load } = require("cheerio");
const {
  parsePriceNumber,
  sanitizeImageUrl,
  similarityScore,
} = require("./normalizers");
const { getPlatformConfig } = require("./platforms");

const PLATFORM_PRICE_SELECTORS = {
  amazon: [
    "#corePrice_feature_div .a-price .a-offscreen",
    "#corePrice_feature_div .a-offscreen",
    "#priceblock_ourprice",
    "#priceblock_dealprice",
  ],
  flipkart: ["._30jeq3", "._16Jk6d", "[data-testid='price']"],
  myntra: [".pdp-price strong", ".pdp-discount-container span"],
  ajio: [".prod-sp", ".prod-mrp"],
  croma: [".amount", "[class*='amount']", "[class*='price']"],
  reliancedigital: [".TextWeb__Text-sc-1cyx778-0", "[class*='price']"],
};

const tryParseJson = (rawValue) => {
  try {
    return JSON.parse(rawValue);
  } catch {
    return null;
  }
};

const collectJsonLdProducts = (node, collection) => {
  if (!node) {
    return;
  }

  if (Array.isArray(node)) {
    node.forEach((item) => collectJsonLdProducts(item, collection));
    return;
  }

  if (typeof node !== "object") {
    return;
  }

  const typeRaw = node["@type"] || node.type || "";
  const typeList = Array.isArray(typeRaw) ? typeRaw : [typeRaw];
  const normalizedTypes = typeList
    .map((value) => String(value).toLowerCase())
    .filter(Boolean);

  if (normalizedTypes.some((type) => type.includes("product"))) {
    collection.push(node);
  }

  Object.values(node).forEach((value) =>
    collectJsonLdProducts(value, collection),
  );
};

const getMetaContent = ($, selectors) => {
  for (const selector of selectors) {
    const content = $(selector).attr("content") || $(selector).attr("value");
    if (content) {
      return String(content).trim();
    }
  }

  return "";
};

const getPriceFromSelectors = ($, platformId) => {
  const selectors = PLATFORM_PRICE_SELECTORS[platformId] || [];

  for (const selector of selectors) {
    const elementText = $(selector).first().text().trim();
    const parsed = parsePriceNumber(elementText);
    if (parsed !== null) {
      return parsed;
    }
  }

  return null;
};

const getPriceFromTextFallback = (rawText) => {
  const text = String(rawText || "");

  const patterns = [
    /(?:₹|rs\.?|inr)\s*([0-9][0-9,\.]{1,15})/gi,
    /([0-9][0-9,\.]{2,15})\s*(?:₹|rs\.?|inr)/gi,
  ];

  const prices = [];

  patterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const value = parsePriceNumber(match[1]);
      if (value !== null) {
        prices.push(value);
      }
    }
  });

  if (prices.length === 0) {
    return null;
  }

  return Math.min(...prices);
};

const extractFromJsonLd = ($) => {
  const products = [];

  $("script[type='application/ld+json']").each((_index, element) => {
    const rawJson = $(element).contents().text();
    const parsedJson = tryParseJson(rawJson);
    if (!parsedJson) {
      return;
    }

    collectJsonLdProducts(parsedJson, products);
  });

  if (products.length === 0) {
    return null;
  }

  const first = products[0];
  const offers = Array.isArray(first.offers) ? first.offers[0] : first.offers;

  const price =
    parsePriceNumber(offers?.price) ||
    parsePriceNumber(offers?.priceSpecification?.price) ||
    null;

  const title = String(first.name || "").trim();
  const imageRaw = Array.isArray(first.image) ? first.image[0] : first.image;

  return {
    title,
    image: sanitizeImageUrl(imageRaw),
    price,
  };
};

const deriveTitleFromUrl = (urlValue) => {
  try {
    const parsedUrl = new URL(urlValue);
    const slug = parsedUrl.pathname.split("/").filter(Boolean).pop();

    if (!slug) {
      return "";
    }

    return slug
      .replace(/[-_]+/g, " ")
      .replace(/\.[a-z0-9]+$/i, "")
      .trim();
  } catch {
    return "";
  }
};

const extractProductFromDocument = ({
  url,
  platformId,
  html,
  targetText,
  source = "direct",
}) => {
  if (!html || typeof html !== "string") {
    return null;
  }

  const $ = load(html);

  const structured = extractFromJsonLd($);

  const metaTitle = getMetaContent($, [
    "meta[property='og:title']",
    "meta[name='twitter:title']",
    "meta[name='title']",
  ]);

  const docTitle = $("title").first().text().trim();
  const h1 = $("h1").first().text().trim();

  const title =
    structured?.title || metaTitle || h1 || docTitle || deriveTitleFromUrl(url);

  if (!title) {
    return null;
  }

  const image =
    structured?.image ||
    sanitizeImageUrl(
      getMetaContent($, [
        "meta[property='og:image']",
        "meta[name='twitter:image']",
      ]),
    );

  const metaPrice = getMetaContent($, [
    "meta[property='product:price:amount']",
    "meta[itemprop='price']",
  ]);

  const textContent = $.root().text();

  const price =
    structured?.price ||
    parsePriceNumber(metaPrice) ||
    getPriceFromSelectors($, platformId) ||
    getPriceFromTextFallback(textContent);

  if (price === null) {
    return null;
  }

  const platform = getPlatformConfig(platformId);
  const relevance = similarityScore(targetText, title);

  return {
    title,
    price,
    platform: platform?.name || platformId,
    url,
    image,
    score: relevance,
    source,
  };
};

module.exports = {
  extractProductFromDocument,
};
