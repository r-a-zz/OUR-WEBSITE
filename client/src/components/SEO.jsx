import React from "react";

const SEO = ({
  title = "Our Amazing Website",
  description = "Experience the future of web design with stunning visuals and seamless interactions",
  keywords = "web development, design, react, modern website",
  image = "/og-image.jpg",
  url = "https://ourwebsite.com",
}) => {
  React.useEffect(() => {
    // Update document title
    document.title = title;

    // Update meta tags
    const updateMetaTag = (name, content, property = false) => {
      const selector = property
        ? `meta[property="${name}"]`
        : `meta[name="${name}"]`;
      let element = document.querySelector(selector);

      if (element) {
        element.setAttribute("content", content);
      } else {
        element = document.createElement("meta");
        if (property) {
          element.setAttribute("property", name);
        } else {
          element.setAttribute("name", name);
        }
        element.setAttribute("content", content);
        document.head.appendChild(element);
      }
    };

    // Basic meta tags
    updateMetaTag("description", description);
    updateMetaTag("keywords", keywords);
    updateMetaTag("author", "Our Amazing Team");
    updateMetaTag("viewport", "width=device-width, initial-scale=1.0");

    // Open Graph tags
    updateMetaTag("og:title", title, true);
    updateMetaTag("og:description", description, true);
    updateMetaTag("og:image", image, true);
    updateMetaTag("og:url", url, true);
    updateMetaTag("og:type", "website", true);
    updateMetaTag("og:site_name", "Our Amazing Website", true);

    // Twitter Card tags
    updateMetaTag("twitter:card", "summary_large_image");
    updateMetaTag("twitter:title", title);
    updateMetaTag("twitter:description", description);
    updateMetaTag("twitter:image", image);

    // Additional SEO tags
    updateMetaTag("robots", "index, follow");
    updateMetaTag("language", "en");
    updateMetaTag("revisit-after", "7 days");
  }, [title, description, keywords, image, url]);

  return null; // This component doesn't render anything
};

export default SEO;
