const CLEANUP_MARKER_KEY = "polaris.makerSnapshotCleanup.v1";

function isLegacyMakerSnapshotKey(key) {
  return key === "polaris.makerSnapshot.v1"
    || key === "polaris.makerSnapshot.v2"
    || key === "polaris.makerSnapshotIndex.v1"
    || key === "polaris.makerSnapshotIndex.v2"
    || key.startsWith("polaris.makerSnapshot.v1:")
    || key.startsWith("polaris.makerSnapshot.v2:")
    || key.startsWith("polaris.makerSnapshotIndex.v2:");
}

export async function cleanupLegacyMakerSnapshots({ storage, markerKey = CLEANUP_MARKER_KEY }) {
  const marker = await storage.get(markerKey);
  if (marker?.[markerKey]) return "already-cleaned";

  const items = await storage.get(null);
  const keys = Object.keys(items).filter(isLegacyMakerSnapshotKey);
  if (keys.length > 0) await storage.remove(keys);
  await storage.set({ [markerKey]: true });
  return "cleaned";
}
