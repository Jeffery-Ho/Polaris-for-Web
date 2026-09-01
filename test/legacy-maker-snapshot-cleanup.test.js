import test from "node:test";
import assert from "node:assert/strict";

import { cleanupLegacyMakerSnapshots } from "../src/legacy-maker-snapshot-cleanup.js";

function createStorage(values, { failRemove = false } = {}) {
  const calls = { get: [], remove: [], set: [] };
  return {
    calls,
    async get(key) {
      calls.get.push(key);
      return key === null ? structuredClone(values) : { [key]: values[key] };
    },
    async remove(keys) {
      calls.remove.push([...keys]);
      if (failRemove) throw new Error("remove failed");
      keys.forEach((key) => delete values[key]);
    },
    async set(items) {
      calls.set.push(structuredClone(items));
      Object.assign(values, structuredClone(items));
    }
  };
}

test("仅清理 Polaris v1/v2 快照和索引，保留其他扩展设置", async () => {
  const values = {
    "polaris.makerSnapshot.v1:chatgpt:old": { conversation: "secret" },
    "polaris.makerSnapshot.v2:chatgpt:new": { conversation: "secret" },
    "polaris.makerSnapshot.v1": { conversation: "secret" },
    "polaris.makerSnapshot.v2": { conversation: "secret" },
    "polaris.makerSnapshotIndex.v1": ["old"],
    "polaris.makerSnapshotIndex.v2:chatgpt": ["new"],
    "gpt-paragraph-nav-config": { enabled: true },
    "polaris.rating.dismissed": true,
    "polaris.release-notice.dismissed": "0.43.1"
  };
  const storage = createStorage(values);

  assert.equal(await cleanupLegacyMakerSnapshots({ storage }), "cleaned");
  assert.deepEqual(storage.calls.remove[0].sort(), [
    "polaris.makerSnapshot.v1:chatgpt:old",
    "polaris.makerSnapshot.v2:chatgpt:new",
    "polaris.makerSnapshot.v1",
    "polaris.makerSnapshot.v2",
    "polaris.makerSnapshotIndex.v1",
    "polaris.makerSnapshotIndex.v2:chatgpt"
  ].sort());
  assert.deepEqual(values["gpt-paragraph-nav-config"], { enabled: true });
  assert.equal(values["polaris.rating.dismissed"], true);
  assert.equal(values["polaris.release-notice.dismissed"], "0.43.1");
  assert.equal(values["polaris.makerSnapshotCleanup.v1"], true);
});

test("已有清理标记后不再扫描或删除存储", async () => {
  const storage = createStorage({ "polaris.makerSnapshotCleanup.v1": true });

  assert.equal(await cleanupLegacyMakerSnapshots({ storage }), "already-cleaned");
  assert.deepEqual(storage.calls.get, ["polaris.makerSnapshotCleanup.v1"]);
  assert.deepEqual(storage.calls.remove, []);
  assert.deepEqual(storage.calls.set, []);
});

test("删除失败时不写清理标记", async () => {
  const storage = createStorage({ "polaris.makerSnapshot.v1:old": {} }, { failRemove: true });

  await assert.rejects(cleanupLegacyMakerSnapshots({ storage }), /remove failed/);
  assert.equal(storage.calls.set.length, 0);
});
