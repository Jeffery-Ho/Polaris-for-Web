export function createMarkerListActiveTracker({ setActive }) {
  let activeElement = null;

  function current() {
    if (activeElement?.isConnected === false) {
      activeElement = null;
    }
    return activeElement;
  }

  function sync(nextElement) {
    const previousElement = current();
    const connectedNextElement = nextElement?.isConnected === false ? null : nextElement || null;
    if (previousElement === connectedNextElement) {
      return connectedNextElement;
    }
    if (previousElement) {
      setActive(previousElement, false);
    }
    activeElement = connectedNextElement;
    if (activeElement) {
      setActive(activeElement, true);
    }
    return activeElement;
  }

  function reset() {
    sync(null);
  }

  return { sync, current, reset };
}
