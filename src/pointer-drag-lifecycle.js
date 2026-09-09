import { hasExceededMarkerListDragThreshold } from "./marker-list-drag.js";

export function createPointerDragLifecycle({ threshold = 4 } = {}) {
  let active = null;

  function finish({ pointerId, persistPosition, reason }) {
    if (!active || (pointerId !== undefined && active.pointerId !== pointerId)) {
      return null;
    }

    const result = {
      drag: active,
      persistPosition: Boolean(persistPosition),
      reason: reason || "unknown"
    };
    active = null;
    return result;
  }

  return {
    begin(candidate) {
      if (active) {
        return null;
      }

      active = { ...candidate, didDrag: false };
      return active;
    },

    move(event) {
      if (!active || active.pointerId !== event.pointerId) {
        return null;
      }

      const deltaX = event.clientX - active.startX;
      const deltaY = event.clientY - active.startY;
      if (!active.didDrag && !hasExceededMarkerListDragThreshold({ deltaX, deltaY, threshold })) {
        return { drag: active, deltaX, deltaY, didStart: false };
      }

      const didStart = !active.didDrag;
      active.didDrag = true;
      return { drag: active, deltaX, deltaY, didStart };
    },

    finish,

    cancel(reason = "cancelled") {
      return finish({ persistPosition: false, reason });
    },

    get active() {
      return active;
    }
  };
}
