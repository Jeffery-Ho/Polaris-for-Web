function waitForMakerElement({
  makerKey,
  resolveElement,
  timeoutMs,
  pollMs,
  now,
  setTimer
}) {
  return new Promise((resolve) => {
    const startedAt = now();
    const check = () => {
      const element = resolveElement(makerKey);
      if (element) {
        resolve(element);
        return;
      }
      if (now() - startedAt >= timeoutMs) {
        resolve(null);
        return;
      }
      setTimer(check, pollMs);
    };
    check();
  });
}

export async function recoverMakerElement({
  makerKey,
  scrollContainer,
  scrollRatio,
  resolveElement,
  timeoutMs = 2000,
  pollMs = 50,
  now = () => performance.now(),
  setTimer = (callback, delay) => setTimeout(callback, delay)
}) {
  const originalScrollTop = scrollContainer.scrollTop;
  const maxScrollTop = Math.max(0, scrollContainer.scrollHeight - scrollContainer.clientHeight);
  const targetScrollTop = Math.round(maxScrollTop * Math.min(1, Math.max(0, scrollRatio || 0)));
  scrollContainer.scrollTo({ top: targetScrollTop, behavior: "auto" });

  const element = await waitForMakerElement({
    makerKey,
    resolveElement,
    timeoutMs,
    pollMs,
    now,
    setTimer
  });
  if (element) {
    return element;
  }
  scrollContainer.scrollTo({ top: originalScrollTop, behavior: "auto" });
  return null;
}

