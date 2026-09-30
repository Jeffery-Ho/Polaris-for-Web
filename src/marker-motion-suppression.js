export function createMarkerMotionSuppressor({
  setSuppressed,
  requestFrame = globalThis.requestAnimationFrame,
  cancelFrame = globalThis.cancelAnimationFrame
}) {
  let generation = 0;
  let firstFrame = null;
  let secondFrame = null;

  function cancelPendingFrames() {
    if (firstFrame !== null) {
      cancelFrame(firstFrame);
      firstFrame = null;
    }
    if (secondFrame !== null) {
      cancelFrame(secondFrame);
      secondFrame = null;
    }
  }

  function suppress() {
    generation += 1;
    const currentGeneration = generation;
    cancelPendingFrames();
    setSuppressed(true);
    firstFrame = requestFrame(() => {
      firstFrame = null;
      secondFrame = requestFrame(() => {
        secondFrame = null;
        if (currentGeneration === generation) {
          setSuppressed(false);
        }
      });
    });
  }

  function reset() {
    generation += 1;
    cancelPendingFrames();
    setSuppressed(false);
  }

  return { reset, suppress };
}

export function createMarkerStreamingIndicator({
  setActive,
  quietMs = 900,
  setTimer = globalThis.setTimeout,
  clearTimer = globalThis.clearTimeout
}) {
  let activeMarker = null;
  let quietTimer = null;

  function clearActiveMarker() {
    quietTimer = null;
    if (activeMarker) {
      setActive(activeMarker, false);
      activeMarker = null;
    }
  }

  function pulse(marker) {
    if (!marker) {
      return;
    }
    if (quietTimer !== null) {
      clearTimer(quietTimer);
    }
    if (activeMarker && activeMarker !== marker) {
      setActive(activeMarker, false);
    }
    activeMarker = marker;
    setActive(activeMarker, true);
    quietTimer = setTimer(clearActiveMarker, quietMs);
  }

  function reset() {
    if (quietTimer !== null) {
      clearTimer(quietTimer);
      quietTimer = null;
    }
    if (activeMarker) {
      setActive(activeMarker, false);
      activeMarker = null;
    }
  }

  return { pulse, reset };
}
