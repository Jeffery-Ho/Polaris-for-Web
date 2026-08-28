# ChatGPT Maker Snapshot Storage

## Purpose

ChatGPT can recycle older message DOM while a long conversation remains open. Polaris keeps a temporary Maker snapshot so the navigation list does not lose those entries when their source nodes are detached.

This feature applies only to ChatGPT. Other supported platforms continue to derive Makers directly from their current DOM.

## Model

`MakerSnapshotModel` owns the snapshot lifecycle behind four operations:

- `open(conversationScope)` restores one conversation and performs expiration cleanup.
- `reconcile(observation)` merges the active ChatGPT branch with the currently mounted DOM.
- `resolveElement(makerKey)` returns the current runtime DOM binding, if available.
- `close()` clears runtime bindings and pending writes without deleting the saved snapshot.

Persistent Maker records never contain DOM nodes or selectors. Each record stores a stable random `makerKey`, ChatGPT assistant and user-group identity, canonical source kind, within-message ordinal, title fingerprint, display title, level, order, last-known scroll ratio, and timestamps. User groups persist only their first-line preview. Full prompts and AI response bodies are not stored.

## Reconciliation

For each active assistant message, observations first match a saved Maker by message ID, canonical kind, title fingerprint, and ordinal. If a streaming title changes, message ID, kind, and ordinal provide the fallback. A newly discovered Maker receives a random key that is retained when its DOM node is replaced.

Mounted assistant messages replace their previously saved Maker set. Makers belonging to active but unmounted messages remain cached. Makers whose assistant IDs leave ChatGPT's active branch are removed. A streaming Maker without an authoritative assistant ID remains memory-only and starts persisting after the ID becomes available without changing its key.

The DOM is a runtime adapter: every scan rebuilds `makerKey -> HTMLElement` bindings. Chapter View and active-section detection use only currently bound elements.

## Storage lifecycle

Snapshots use these `chrome.storage.local` keys:

```text
polaris.makerSnapshot.v1:<conversationKey>
polaris.makerSnapshotIndex.v1
```

The first valid Maker is saved immediately. Later changes use a one-second trailing write. Snapshots expire seven days after their latest write. Cleanup retains at most 20 conversations and 2 MB of snapshot data, evicting least-recently-used conversations after expired entries.

Storage corruption, quota errors, or an unavailable extension context disable persistence for the current page and leave the in-memory Maker model operational. Cleanup only removes Polaris Maker snapshot keys.

## Missing DOM jump

Clicking a cached Maker first attempts the normal exact jump. If no DOM binding exists, Polaris records the current scroll position, moves to the saved scroll ratio, and waits up to two seconds for ChatGPT to mount and remap the target. A successful remap performs the exact jump. A timeout restores the original scroll position and shows the existing not-loaded notice.

