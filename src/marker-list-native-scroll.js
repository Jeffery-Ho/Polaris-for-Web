const MARKER_LIST_CARD_SELECTOR = ".gpt-paragraph-nav__marker, .gpt-paragraph-nav__fold";

export function markerListCardForTarget(target, list) {
  const card = typeof target?.closest === "function"
    ? target.closest(MARKER_LIST_CARD_SELECTOR)
    : null;
  return card && list.contains(card) ? card : null;
}

export function createMarkerListNativeWheelHandler({ list, cancelAutoPosition }) {
  return function handleNativeMarkerListWheel(event) {
    if (!markerListCardForTarget(event.target, list)) {
      return false;
    }
    cancelAutoPosition();
    return true;
  };
}
