function pad(value) {
  return String(value).padStart(2, "0");
}

export function diagnosticFilename(date = new Date()) {
  return [
    "polaris-diagnostics-",
    date.getUTCFullYear(),
    pad(date.getUTCMonth() + 1),
    pad(date.getUTCDate()),
    "-",
    pad(date.getUTCHours()),
    pad(date.getUTCMinutes()),
    pad(date.getUTCSeconds()),
    ".json"
  ].join("");
}

export function downloadDiagnosticLog({
  document = globalThis.document,
  urlApi = globalThis.URL,
  text,
  filename = diagnosticFilename()
} = {}) {
  if (!document?.body || typeof document.createElement !== "function" || !urlApi?.createObjectURL) {
    return false;
  }

  let objectUrl = "";
  try {
    const blob = new Blob([String(text ?? "")], { type: "application/json" });
    objectUrl = urlApi.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.hidden = true;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove?.();
    return true;
  } catch {
    return false;
  } finally {
    if (objectUrl && typeof urlApi.revokeObjectURL === "function") {
      urlApi.revokeObjectURL(objectUrl);
    }
  }
}

export function openDiagnosticEmail({
  document = globalThis.document,
  email,
  subject,
  body
} = {}) {
  if (!document?.body || typeof document.createElement !== "function" || !email) {
    return false;
  }

  try {
    const anchor = document.createElement("a");
    anchor.href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject || "")}&body=${encodeURIComponent(body || "")}`;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.hidden = true;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove?.();
    return true;
  } catch {
    return false;
  }
}
