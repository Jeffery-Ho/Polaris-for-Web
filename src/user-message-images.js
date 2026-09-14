export function safeUserMessageImageUrl(value, baseUrl) {
  try {
    const pageUrl = new URL(baseUrl);
    const url = new URL(String(value || ""), pageUrl);
    if (url.protocol === "https:") {
      return url.href;
    }
    return url.protocol === "blob:" && url.origin === pageUrl.origin ? url.href : "";
  } catch {
    return "";
  }
}

export function userMessageThumbnailForSources(sources, baseUrl) {
  const imageUrls = [];
  const seen = new Set();
  const values = Array.isArray(sources) ? sources : [];
  for (const source of values) {
    const url = safeUserMessageImageUrl(source, baseUrl);
    if (url && !seen.has(url)) {
      seen.add(url);
      imageUrls.push(url);
    }
  }
  return {
    imageUrls,
    thumbnailSrc: imageUrls[0] || "",
    imageCount: imageUrls.length
  };
}
