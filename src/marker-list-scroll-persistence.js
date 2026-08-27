export function createMarkerListScrollPersistence({
  durationMs,
  now,
  requestFrame,
  cancelFrame,
  keepActiveMarkerVisible
}) {
  let deadline = 0;
  let scheduledFrame = 0;

  function cancel() {
    deadline = 0;
    if (scheduledFrame) {
      cancelFrame(scheduledFrame);
      scheduledFrame = 0;
    }
  }

  function schedule() {
    if (scheduledFrame || now() >= deadline) {
      return;
    }

    scheduledFrame = requestFrame(() => {
      scheduledFrame = 0;
      if (now() >= deadline) {
        deadline = 0;
        return;
      }
      if (!keepActiveMarkerVisible()) {
        deadline = 0;
        return;
      }
      schedule();
    });
  }

  function request() {
    deadline = now() + durationMs;
    schedule();
  }

  return {
    request,
    cancel,
    reset: cancel
  };
}
