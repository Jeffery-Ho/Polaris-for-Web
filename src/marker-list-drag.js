const MARKER_SELECTOR = ".gpt-paragraph-nav__marker";

export function shouldStartMarkerListPointerDrag(target) {
  return !(target && typeof target.closest === "function" && target.closest(MARKER_SELECTOR));
}
