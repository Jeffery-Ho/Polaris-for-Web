const IDLE_STATE = Object.freeze({
  status: "idle",
  addedGroups: 0,
  addedMakers: 0,
  reachedStart: false,
  partial: false
});

function isAbortError(error) {
  return error?.name === "AbortError";
}

export function createHistoricalMakerLoader({
  now = () => performance.now(),
  setTimer = (callback, delay) => setTimeout(callback, delay),
  clearTimer = (timer) => clearTimeout(timer)
} = {}) {
  let state = IDLE_STATE;
  let activeRun = null;

  function scopeKey(scope) {
    return `${scope?.platformKey || ""}:${scope?.conversationKey || ""}:${scope?.persistence ? "persistent" : "memory"}`;
  }

  function current() {
    return { ...state };
  }

  function cancel(reason = "cancelled") {
    if (!activeRun) {
      return;
    }
    activeRun.controller.abort(reason);
  }

  async function start({ scope, source, timeoutMs = 10_000, onProgress = () => {} }) {
    const nextScopeKey = scopeKey(scope);
    if (activeRun?.scopeKey === nextScopeKey) {
      return current();
    }
    activeRun?.controller.abort("superseded");
    const activeController = new AbortController();
    const run = { controller: activeController, scopeKey: nextScopeKey };
    activeRun = run;
    const { signal } = activeController;
    const timeoutTimer = setTimer(() => activeController.abort("timeout"), timeoutMs);
    const startedAt = now();
    let initial = {
      scrollTop: 0,
      scrollHeight: 0,
      clientHeight: 0,
      groupCount: 0,
      makerCount: 0
    };
    let partial = false;
    let stablePasses = 0;
    let previous = initial;
    let runState = state;

    const publish = (status, measurement = previous) => {
      runState = {
        status,
        addedGroups: Math.max(0, measurement.groupCount - initial.groupCount),
        addedMakers: Math.max(0, measurement.makerCount - initial.makerCount),
        reachedStart: measurement.scrollTop <= 1,
        partial
      };
      if (activeRun === run) {
        state = runState;
        onProgress({ ...runState });
      }
      return { ...runState };
    };

    try {
      initial = source.measure();
      previous = initial;
      publish("loading", initial);
      try {
        await source.prepare({ signal });
      } catch (error) {
        if (isAbortError(error)) {
          throw error;
        }
        partial = true;
      }

      while (!signal.aborted) {
        if (now() - startedAt >= timeoutMs) {
          return publish("timeout");
        }
        source.scrollEarlier();
        await source.waitForChange({ signal });
        const next = source.measure();
        const didProgress = next.scrollTop !== previous.scrollTop
          || next.scrollHeight !== previous.scrollHeight
          || next.groupCount !== previous.groupCount
          || next.makerCount !== previous.makerCount;
        stablePasses = didProgress ? 0 : stablePasses + 1;
        previous = next;
        publish("loading", next);

        if (next.scrollTop <= 1 && stablePasses >= 3) {
          return publish("complete", next);
        }
        if (next.scrollTop > 1 && stablePasses >= 3) {
          return publish("stalled", next);
        }
      }
      return publish(signal.reason === "timeout" ? "timeout" : "cancelled");
    } catch (error) {
      if (isAbortError(error) || signal.aborted) {
        return publish(signal.reason === "timeout" ? "timeout" : "cancelled");
      }
      return publish("unavailable");
    } finally {
      clearTimer(timeoutTimer);
      if (activeRun === run) {
        activeRun = null;
      }
    }
  }

  return { start, cancel, current };
}
