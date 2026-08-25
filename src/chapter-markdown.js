const BLOCK_TAG_NAMES = new Set([
  "p", "li", "h1", "h2", "h3", "h4", "h5", "h6", "pre", "blockquote", "table", "ul", "ol", "figure", "img"
]);

const CONTENT_TAG_NAMES = new Set([
  ...BLOCK_TAG_NAMES,
  "thead", "tbody", "tfoot", "tr", "th", "td", "caption", "li", "figcaption",
  "strong", "em", "del", "code", "br", "a", "input"
]);

const TAG_ALIASES = Object.freeze({
  b: "strong",
  i: "em",
  s: "del",
  strike: "del"
});

const DISCARDED_TAG_NAMES = new Set([
  "script", "style", "iframe", "object", "embed", "link", "meta", "svg", "template"
]);

function normalizedTagName(tagName) {
  return String(tagName || "").toLowerCase();
}

export function chapterContentTagName(tagName) {
  const normalized = normalizedTagName(tagName);
  const tag = TAG_ALIASES[normalized] || normalized;
  return CONTENT_TAG_NAMES.has(tag) ? tag : "";
}

export function isChapterBlockTag(tagName) {
  return BLOCK_TAG_NAMES.has(normalizedTagName(tagName));
}

export const CHAPTER_BLOCK_SELECTOR = Array.from(BLOCK_TAG_NAMES).join(", ");

export function shouldDiscardChapterNode(tagName) {
  return DISCARDED_TAG_NAMES.has(normalizedTagName(tagName));
}

export function safeChapterUrl(value, baseUrl, allowedProtocols) {
  try {
    const url = new URL(String(value || ""), baseUrl);
    return allowedProtocols.includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

export function safeChapterLinkHref(value, baseUrl) {
  return safeChapterUrl(value, baseUrl, ["http:", "https:", "mailto:"]);
}

export function safeChapterImageSrc(value, baseUrl) {
  return safeChapterUrl(value, baseUrl, ["http:", "https:"]);
}

export function appendSanitizedChapterContent(target, source, ownerDocument, baseUrl) {
  source.childNodes.forEach((node) => appendSanitizedChapterNode(target, node, ownerDocument, baseUrl));
}

export function appendSanitizedChapterNode(target, source, ownerDocument, baseUrl) {
  if (source.nodeType === 3) {
    target.appendChild(ownerDocument.createTextNode(source.textContent || ""));
    return;
  }

  if (source.nodeType !== 1) {
    return;
  }

  if (shouldDiscardChapterNode(source.tagName)) {
    return;
  }

  const tagName = chapterContentTagName(source.tagName);
  if (!tagName) {
    appendSanitizedChapterContent(target, source, ownerDocument, baseUrl);
    return;
  }

  if (tagName === "br") {
    target.appendChild(ownerDocument.createElement("br"));
    return;
  }

  if (tagName === "a") {
    const href = safeChapterLinkHref(source.getAttribute("href"), baseUrl);
    if (!href) {
      appendSanitizedChapterContent(target, source, ownerDocument, baseUrl);
      return;
    }
    const link = ownerDocument.createElement("a");
    link.href = href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    appendSanitizedChapterContent(link, source, ownerDocument, baseUrl);
    target.appendChild(link);
    return;
  }

  if (tagName === "img") {
    const src = safeChapterImageSrc(source.getAttribute("src") || source.getAttribute("data-src"), baseUrl);
    if (!src) {
      return;
    }
    const image = ownerDocument.createElement("img");
    image.className = "gpt-paragraph-nav__explosion-image";
    image.src = src;
    image.alt = source.getAttribute("alt") || "";
    image.loading = "lazy";
    image.decoding = "async";
    if (target.tagName === "A") {
      image.addEventListener("error", () => image.remove());
      target.appendChild(image);
      return;
    }
    const link = ownerDocument.createElement("a");
    link.className = "gpt-paragraph-nav__explosion-image-link";
    link.href = src;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    image.addEventListener("error", () => link.remove());
    link.appendChild(image);
    target.appendChild(link);
    return;
  }

  if (tagName === "input") {
    if (String(source.getAttribute("type") || "").toLowerCase() !== "checkbox") {
      return;
    }
    const checkbox = ownerDocument.createElement("input");
    checkbox.className = "gpt-paragraph-nav__explosion-task-checkbox";
    checkbox.type = "checkbox";
    checkbox.checked = source.hasAttribute("checked") || Boolean(source.checked);
    checkbox.disabled = true;
    checkbox.setAttribute("aria-hidden", "true");
    target.appendChild(checkbox);
    return;
  }

  const element = ownerDocument.createElement(tagName);
  if (tagName === "li" && source.querySelector('input[type="checkbox"]')) {
    element.className = "gpt-paragraph-nav__explosion-task-item";
  }
  if (tagName === "td" || tagName === "th") {
    const colspan = Number.parseInt(source.getAttribute("colspan") || "", 10);
    const rowspan = Number.parseInt(source.getAttribute("rowspan") || "", 10);
    if (colspan > 1) {
      element.colSpan = colspan;
    }
    if (rowspan > 1) {
      element.rowSpan = rowspan;
    }
  }
  appendSanitizedChapterContent(element, source, ownerDocument, baseUrl);
  target.appendChild(element);
}
