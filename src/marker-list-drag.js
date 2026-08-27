const MARKER_SELECTOR = ".gpt-paragraph-nav__marker";

export function preserveMarkerListDragPosition({
  drag,
  list,
  maxScrollTop,
  scrollDelta
}) {
  if (!drag || drag.kind !== "list" || drag.list !== list) {
    return;
  }
  drag.startScrollTop += scrollDelta;
  drag.maxScrollTop = maxScrollTop;
}

export function shouldStartMarkerListPointerDrag(target) {
  return !(target && typeof target.closest === "function" && target.closest(MARKER_SELECTOR));
}
