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
