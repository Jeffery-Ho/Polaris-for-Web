export function sendRuntimeMessage(chromeApi, message) {
  try {
    const pending = chromeApi?.runtime?.sendMessage(message);
    if (pending && typeof pending.catch === "function") {
      pending.catch(() => undefined);
    }
  } catch {
    // The extension context may be invalidated during an update or worker restart.
  }
}
