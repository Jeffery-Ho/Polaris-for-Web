const TABLE_MARKER_TITLE_MAX_LENGTH = 160;

export function tableMarkerScrollTop({ scrollTop, targetTop, scrollerTop, headerHeight, gap, maxScrollTop = Infinity }) {
  if (![scrollTop, targetTop, scrollerTop, headerHeight, gap].every(Number.isFinite)) {
    return null;
  }
  const targetScrollTop = scrollTop + targetTop - scrollerTop - headerHeight - gap;
  const maximum = Number.isFinite(maxScrollTop) ? Math.max(0, maxScrollTop) : Infinity;
  return Math.min(maximum, Math.max(0, targetScrollTop));
}

export function scrollTableMarkerIntoView({ element, scrollContainer, headerHeight, gap, behavior }) {
  if (!element || typeof element.scrollIntoView !== "function") {
    return false;
  }
  if (
    !scrollContainer ||
    typeof scrollContainer.scrollTo !== "function" ||
    typeof element.getBoundingClientRect !== "function" ||
    typeof scrollContainer.getBoundingClientRect !== "function"
  ) {
    element.scrollIntoView({ behavior, block: "start" });
    return true;
  }

  const scrollTop = tableMarkerScrollTop({
    scrollTop: scrollContainer.scrollTop,
    targetTop: element.getBoundingClientRect().top,
    scrollerTop: scrollContainer.getBoundingClientRect().top,
    headerHeight,
    gap,
    maxScrollTop: scrollContainer.scrollHeight - scrollContainer.clientHeight
  });
  if (scrollTop === null) {
    element.scrollIntoView({ behavior, block: "start" });
    return true;
  }

  scrollContainer.scrollTo({ top: scrollTop, behavior });
  return true;
}

export function tableMarkerTitleFromCells(cells) {
  const titles = Array.from(cells || [])
    .map((cell) => String(cell || "").replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const title = titles.join(" / ");
  return titles.length >= 2 && title.length <= TABLE_MARKER_TITLE_MAX_LENGTH ? title : "";
}

export function tableMarkerEntries(entries) {
  const seen = new Set();
  return Array.from(entries || []).flatMap(({ element, cells }) => {
    if (seen.has(element)) {
      return [];
    }
    seen.add(element);
    const title = tableMarkerTitleFromCells(cells);
    return title ? [{ element, title }] : [];
  });
}
