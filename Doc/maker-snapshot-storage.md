# Multi-platform Maker Snapshot Storage

## Purpose

Polaris treats a Maker as a domain record rather than a property of one DOM node. ChatGPT, Doubao, Kimi, Qianwen, Yuanbao, and Xiaohongshu Diandian use the same model, so a DOM replacement does not by itself remove or re-key a Maker.

Each platform Adapter identifies the current conversation and converts its API or DOM state into a shared observation. The current integrations persist only when the Adapter finds an allowlisted route or query token. Otherwise the same model runs in memory-only mode, preventing data from different conversations from sharing a snapshot.

## Model interface

`MakerSnapshotModel` owns the lifecycle behind four operations:

- `open({ platformKey, conversationKey, persistence })` restores one scope and performs expiration cleanup.
- `reconcile({ coverage, authoritativeMessageKeys, mountedMessageKeys, groups, makers })` merges platform observations.
- `resolveElement(makerKey)` returns the current runtime DOM binding, if available.
- `close()` clears runtime bindings and pending writes without deleting a saved snapshot.

Persistent Maker records contain `makerKey`, `groupKey`, `sourceMessageKey`, canonical source kind, within-message ordinal, title fingerprint, display title, level, order, last-known scroll ratio, and timestamps. They never contain DOM nodes, selectors, full prompts, or AI response bodies. User groups retain only a first-line preview capped at 160 characters.

## Identity and reconciliation

Adapters prefer semantic conversation and message IDs. The shared Adapter contract supports a group-scoped response ordinal only when a platform integration explicitly proves that both the user group and response order are stable. None of the current partial-coverage integrations enables that derivation, so a missing assistant ID remains memory-only. If a stable group identity cannot be established, the group and its Makers use deterministic page-memory keys and are not persisted.

Maker matching first uses `sourceMessageKey`, canonical kind, title fingerprint, and within-kind ordinal. If a streaming title changes, message identity, kind, and ordinal provide the fallback. Pending memory-only Makers keep their key when a stable source identity later appears.

- `coverage: complete` replaces the observed group set. ChatGPT supplies its active API branch as the authoritative message set.
- `coverage: partial` merges observed groups and preserves unmounted cached groups.
- Mounted messages always replace their own cached Maker set, including replacement with an empty set.
- When `authoritativeMessageKeys` is `null`, unobserved messages are not deleted.

Every scan rebuilds only the runtime `makerKey -> HTMLElement` map. Active-section detection and Chapter View require a current DOM binding, so cached Makers never create empty Chapter sections.

## Storage lifecycle

Version 2 uses per-platform namespaces:

```text
polaris.makerSnapshot.v2:<platformKey>:<conversationKey>
polaris.makerSnapshotIndex.v2:<platformKey>
```

Each platform independently retains at most 20 conversations and 2 MB for seven days, with expired entries removed before least-recently-used eviction. The first valid persistent Maker writes immediately; later changes use a one-second trailing debounce.

ChatGPT version 1 snapshots are migrated lazily when their conversation is first opened. `assistantMessageId` becomes `sourceMessageKey`, while the original `makerKey` is retained. Polaris deletes that v1 conversation only after both the v2 snapshot and platform index are written successfully.

Corruption, quota errors, or an unavailable Storage API disable persistence only for the affected platform in the current page. The in-memory model and navigation remain available, and cleanup never touches non-Polaris storage keys or another platform's index.

## Missing DOM jump

Clicking any cached Maker first attempts an exact jump. If no DOM binding exists, Polaris records the current scroll position, moves to the saved ratio, and waits up to two seconds for the host page to mount and remap the target. Success performs the exact jump; timeout restores the original position and shows the not-loaded notice.
