export const CONTROL_PLACEMENTS = Object.freeze({
  FLOATING: "floating",
  CHATGPT_HEADER: "chatgpt-header"
});

export function normalizeControlPlacement(value) {
  return value === CONTROL_PLACEMENTS.CHATGPT_HEADER
    ? CONTROL_PLACEMENTS.CHATGPT_HEADER
    : CONTROL_PLACEMENTS.FLOATING;
}

export function normalizeHeaderInsertIndex(value) {
  const index = Number(value);
  return Number.isFinite(index) ? Math.max(0, Math.round(index)) : 0;
}

export function clampHeaderInsertIndex(index, actionCount) {
  return Math.min(normalizeHeaderInsertIndex(index), Math.max(0, Number(actionCount) || 0));
}

export function headerInsertIndexForPointer(actionRects, clientX) {
  const index = actionRects.findIndex((rect) => clientX < rect.left + (rect.width / 2));
  return index < 0 ? actionRects.length : index;
}
