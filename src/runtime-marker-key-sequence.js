export function createRuntimeMarkerKeySequence() {
  let keys = new WeakMap();
  let nextKey = 1;

  function keyFor(element) {
    let key = keys.get(element);
    if (!key) {
      key = `marker-${nextKey}`;
      nextKey += 1;
      keys.set(element, key);
    }
    return key;
  }

  function reset() {
    keys = new WeakMap();
    nextKey = 1;
  }

  return { keyFor, reset };
}
