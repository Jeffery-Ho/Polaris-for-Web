import { matchesSearch } from "./window-search.js";

export function createChapterReaderState() {
  return { nodes: [], expanded: new Set(), focus: "", menu: "", initialized: false, views: new Map(), query: "", searchExpanded: null, searchCollapsed: new Set(), scrollY: 0 };
}
export function chapterAncestors(nodes, key) {
  const byKey = nodes instanceof Map ? nodes : new Map(nodes.map((node) => [node.markerKey, node]));
  const path = [];
  const seen = new Set();
  for (let node = byKey.get(key); node && !seen.has(node.markerKey); node = byKey.get(node.parentKey)) {
    path.unshift(node.markerKey);
    seen.add(node.markerKey);
  }
  return path;
}
export function updateChapterReader(state, nodes, preferredKey) {
  const keys = new Set(nodes.map((node) => node.markerKey));
  if (state.focus && !keys.has(state.focus)) {
    state.focus = chapterAncestors(state.nodes, state.focus).reverse().find((key) => keys.has(key)) || "";
    state.scrollY = 0;
  }
  state.nodes = nodes;
  if (!state.initialized && nodes.length) {
    state.expanded = new Set(chapterAncestors(nodes, keys.has(preferredKey) ? preferredKey : nodes[0].markerKey));
    state.initialized = true;
  }
  state.expanded = new Set([...state.expanded].filter((key) => keys.has(key)));
  if (!keys.has(state.menu)) state.menu = "";
}
export function enterChapter(state, key, scrollY) {
  // Returning to a previously visited scope restores that scope's expansion and position.
  state.views.set(state.focus, { expanded: new Set(state.expanded), scrollY, query: state.query, searchExpanded: state.searchExpanded && new Set(state.searchExpanded), searchScrollY: state.searchScrollY, searchCollapsed: new Set(state.searchCollapsed) });
  const saved = state.views.get(key);
  state.focus = key;
  state.expanded = saved ? new Set(saved.expanded) : new Set([key]);
  state.scrollY = saved?.scrollY || 0;
  state.query = saved?.query || "";
  state.searchExpanded = saved?.searchExpanded ? new Set(saved.searchExpanded) : null;
  state.searchScrollY = saved?.searchScrollY || 0;
  state.searchCollapsed = new Set(saved?.searchCollapsed || []);
  state.menu = "";
}
export function searchChapterReader(state, query, scrollY) {
  if (query && !state.query) {
    state.searchExpanded = new Set(state.expanded);
    state.searchScrollY = scrollY;
  }
  if (!query && state.query && state.searchExpanded) {
    state.expanded = state.searchExpanded;
    state.scrollY = state.searchScrollY || 0;
    state.searchExpanded = null;
  } else if (query !== state.query) state.scrollY = 0;
  if (state.query !== query) state.searchCollapsed.clear();
  state.query = query;
  state.menu = "";
}
export function chapterReaderVisibility(state) {
  const byKey = new Map(state.nodes.map((node) => [node.markerKey, node]));
  const scoped = state.nodes.filter((node) => !state.focus || chapterAncestors(byKey, node.markerKey).includes(state.focus));
  const visible = new Set();
  const ancestors = new Set();
  scoped.forEach((node) => {
    if (!state.query) { visible.add(node.markerKey); return; }
    const path = chapterAncestors(byKey, node.markerKey);
    const text = path.map((key) => byKey.get(key)?.title).join(" / ");
    if (!matchesSearch(state.query, text)) return;
    path.forEach((key) => visible.add(key));
    path.slice(0, -1).forEach((key) => ancestors.add(key));
  });
  return { visible, ancestors, roots: scoped.filter((node) => state.focus ? node.markerKey === state.focus : !node.parentKey) };
}
export function chapterTreeText(nodes, key = "") {
  const byKey = new Map(nodes.map((node) => [node.markerKey, node]));
  function text(node, seen = new Set()) {
    if (!node || seen.has(node.markerKey)) return "";
    seen.add(node.markerKey);
    return [node.synthetic ? "" : node.title, ...node.contents.map((part) => part.type === "child" ? text(byKey.get(part.key), seen) : part.text)].filter(Boolean).join("\n\n");
  }
  return (key ? [byKey.get(key)] : nodes.filter((node) => !node.parentKey)).map((node) => text(node)).filter(Boolean).join("\n\n");
}
