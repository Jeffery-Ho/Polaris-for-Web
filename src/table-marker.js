const TABLE_MARKER_TITLE_MAX_LENGTH = 160;

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
