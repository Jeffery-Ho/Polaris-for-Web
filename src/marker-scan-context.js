export function createMarkerScanContext({
  getComputedStyle = globalThis.getComputedStyle,
  scrollY = globalThis.scrollY || 0
} = {}) {
  const rectCache = new WeakMap();
  const visibilityCache = new WeakMap();

  function rectFor(element) {
    if (!rectCache.has(element)) {
      rectCache.set(element, element.getBoundingClientRect());
    }
    return rectCache.get(element);
  }

  function isVisible(element) {
    if (!visibilityCache.has(element)) {
      const style = getComputedStyle(element);
      let visible = false;
      if (style.visibility !== "hidden" && style.display !== "none") {
        if (style.display === "contents") {
          // ChatGPT and Gemini often wrap a message in display:contents.
          // That box is empty, but the headings inside it are on screen.
          visible = Array.from(element.children || []).some((child) => child && isVisible(child));
        } else {
          const rect = rectFor(element);
          visible = rect.width > 0 && rect.height > 0;
        }
      }
      visibilityCache.set(element, visible);
    }
    return visibilityCache.get(element);
  }

  function topFor(element) {
    return rectFor(element).top + scrollY;
  }

  return { rectFor, isVisible, topFor };
}
