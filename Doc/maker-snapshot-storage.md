# Multi-platform Maker Snapshot Storage

## Purpose

Polaris treats a Maker as a domain record rather than a property of one DOM node. ChatGPT, Doubao, Kimi, Qianwen, Yuanbao, and Xiaohongshu Diandian use the same model, so a DOM replacement does not by itself remove or re-key a Maker.

Each platform Adapter identifies the current conversation and converts its API or DOM state into a shared observation. The current integrations persist only when the Adapter finds an allowlisted route or query token. Otherwise the same model runs in memory-only mode, preventing data from different conversations from sharing a snapshot.

## Model interface

`MakerSnapshotModel` owns the lifecycle behind four operations:

- `open({ platformKey, conversationKey, persistence })` restores one scope and performs expiration cleanup.
- `reconcile({ coverage, authoritativeMessageKeys, mountedMessageKeys, sourceMessageAliases, groups, makers })` merges platform observations. `sourceMessageAliases` exists only for the current observation and is never persisted.
- `resolveElement(makerKey)` returns the current runtime DOM binding, if available.
- `close()` clears runtime bindings and pending writes without deleting a saved snapshot.

Persistent Maker records contain `makerKey`, `groupKey`, `sourceMessageKey`, canonical source kind, within-message ordinal, title fingerprint, display title, level, order, last-known scroll ratio, and timestamps. They never contain DOM nodes, selectors, full prompts, or AI response bodies. User groups retain only a first-line preview capped at 160 characters.

## Identity and reconciliation

Within a verified conversation, a response's canonical `sourceMessageKey` is derived from the platform, stable user-group identity, and response ordinal. This canonical key is independent of whether the currently mounted DOM exposes a real assistant message ID. A real ID is supplied through `sourceMessageAliases` so an existing v2 record can migrate in place to the derived key while retaining its original `makerKey`. The schema version and storage namespace remain v2 because the persisted record shape does not change.

ChatGPT builds the derived-key and real-ID alias index from its active API branch. When an assistant DOM node temporarily lacks its ID, Polaris uses only a confirmed user-message DOM identity and a provable response ordinal within that group. If a group has multiple active replies but only an unidentified subset is mounted, no ordinal is guessed; those nodes remain memory-only until the remaining API and DOM replies can be paired one-to-one. Doubao, Kimi, Qianwen, Yuanbao, and Xiaohongshu Diandian use the same derivation only after their Adapter confirms a stable user group. An unverified conversation, unstable group, ambiguous alias, or unprovable DOM ownership remains memory-only; titles are never used to guess a persistent identity.

Maker matching first uses the canonical `sourceMessageKey`, canonical kind, title fingerprint, and within-kind ordinal. Runtime aliases migrate older real-ID records before active-branch retention is applied, including active messages that are not currently mounted. If a streaming title changes, message identity, kind, and ordinal provide the fallback. Pending memory-only Makers keep their key when a stable source identity later appears. An alias that points to more than one canonical message is discarded for that observation rather than risking a wrong mapping.

- `coverage: complete` replaces the observed group set. ChatGPT supplies its active API branch as the authoritative message set.
- `coverage: partial` merges observed groups and preserves unmounted cached groups.
- A partial observation keeps the cached group and Maker order as its historical baseline. Known records retain their position; new records are inserted beside the nearest observed cached anchor, or appended when no anchor exists, before order values are normalized again.
- Mounted messages always replace their own cached Maker set, including replacement with an empty set.
- When `authoritativeMessageKeys` is `null`, unobserved messages are not deleted.

Every scan rebuilds only the runtime `makerKey -> HTMLElement` map. Active-section detection and Chapter View require a current DOM binding, so cached Makers never create empty Chapter sections.

The list continues to show at most the configured number of recent user groups, 20 by default. Every user group starts collapsed after page refresh, route activation, or streaming insertion. A restored history with additional groups exposes the existing earlier-question control; expanding it or searching operates on the full snapshot rather than only the mounted DOM.

The page-memory `marker-N` fallback sequence restarts at `marker-1` whenever a conversation scope is activated. It is independent from persistent `makerKey` values: refreshing rebuilds runtime DOM mappings from the beginning without re-keying saved Makers.

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
