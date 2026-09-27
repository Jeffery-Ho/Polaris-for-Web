export function snapshotDeliveryResult({ isCurrentSource = false, ack = null, errorMessage = "" } = {}) {
  if (!isCurrentSource) {
    return { acceptedBySidePanel: false, reason: "not-current-source-tab" };
  }
  if (errorMessage) {
    const closed = /Receiving end does not exist|Could not establish connection/i.test(String(errorMessage));
    return {
      acceptedBySidePanel: false,
      reason: closed ? "side-panel-closed" : String(errorMessage)
    };
  }
  if (ack?.accepted === true) {
    return { acceptedBySidePanel: true, reason: "" };
  }
  return { acceptedBySidePanel: false, reason: "side-panel-did-not-acknowledge" };
}

export function routeFallbackLogLevel(details) {
  if (!details?.sentToBackground) {
    return "warn";
  }
  if (details.reason === "not-current-source-tab"
    || details.reason === "forward-failed"
    || details.reason === "side-panel-did-not-acknowledge") {
    return "warn";
  }
  if (Number(details.messageNodes) > 0 && Number(details.sections) === 0) {
    return "warn";
  }
  return "info";
}
