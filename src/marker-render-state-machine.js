const MARKER_RENDER_INTERVAL_MS = 120;

export function createMarkerRenderStateMachine({
  readSnapshot,
  hasStartPoint,
  renderSnapshot,
  setTimer = globalThis.setTimeout,
  clearTimer = globalThis.clearTimeout
}) {
  let phase = "waiting-for-start";
  let pendingTimer = null;

  function flush() {
    pendingTimer = null;
    const snapshot = readSnapshot();
    if (phase === "waiting-for-start" && !hasStartPoint(snapshot)) {
      return;
    }

    phase = "progressive-rendering";
    renderSnapshot(snapshot);
  }

  function request() {
    if (pendingTimer !== null) {
      return;
    }
    pendingTimer = setTimer(flush, MARKER_RENDER_INTERVAL_MS);
  }

  function reset() {
    if (pendingTimer !== null) {
      clearTimer(pendingTimer);
      pendingTimer = null;
    }
    phase = "waiting-for-start";
  }

  return { request, reset };
}
