export function hasExceededMarkerListDragThreshold({ deltaX, deltaY, threshold }) {
  return Math.max(Math.abs(deltaX), Math.abs(deltaY)) > threshold;
}

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
