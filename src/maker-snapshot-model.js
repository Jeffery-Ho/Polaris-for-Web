const SNAPSHOT_SCHEMA_VERSION = 2;
const SNAPSHOT_STORAGE_PREFIX = "polaris.makerSnapshot.v2:";
const SNAPSHOT_INDEX_PREFIX = "polaris.makerSnapshotIndex.v2:";
const LEGACY_SCHEMA_VERSION = 1;
const LEGACY_STORAGE_PREFIX = "polaris.makerSnapshot.v1:";
const LEGACY_INDEX_KEY = "polaris.makerSnapshotIndex.v1";
const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const DEFAULT_MAX_CONVERSATIONS = 20;
const DEFAULT_MAX_BYTES = 2 * 1024 * 1024;
const DEFAULT_WRITE_DELAY_MS = 1000;
const MAX_USER_PREVIEW_LENGTH = 160;

function storageKeyForConversation(platformKey, conversationKey) {
  return `${SNAPSHOT_STORAGE_PREFIX}${encodeURIComponent(platformKey)}:${encodeURIComponent(conversationKey)}`;
}

function indexKeyForPlatform(platformKey) {
  return `${SNAPSHOT_INDEX_PREFIX}${encodeURIComponent(platformKey)}`;
}

function legacyConversationKeyFor(scope) {
  return scope.conversationKey.startsWith("chatgpt:")
    ? scope.conversationKey
    : `chatgpt:${scope.conversationKey}`;
}

function legacyStorageKeyForConversation(conversationKey) {
  return `${LEGACY_STORAGE_PREFIX}${encodeURIComponent(conversationKey)}`;
}

function normalizeScope(value) {
  return {
    platformKey: typeof value?.platformKey === "string" ? value.platformKey : "",
    conversationKey: typeof value?.conversationKey === "string" ? value.conversationKey : "",
    persistence: Boolean(value?.persistence)
  };
}

function normalizeIndex(value) {
  return Array.isArray(value)
    ? value.filter((entry) => entry
      && typeof entry.conversationKey === "string"
      && typeof entry.storageKey === "string"
      && Number.isFinite(entry.expiresAt)
      && Number.isFinite(entry.lastAccessedAt)
      && Number.isFinite(entry.bytes))
    : [];
}

function normalizeSnapshot(value, scope, timestamp) {
  if (!value
    || value.schemaVersion !== SNAPSHOT_SCHEMA_VERSION
    || value.platformKey !== scope.platformKey
    || value.conversationKey !== scope.conversationKey
    || !Number.isFinite(value.expiresAt)
    || value.expiresAt <= timestamp
    || !Array.isArray(value.groups)
    || !Array.isArray(value.makers)) {
    return null;
  }
  return {
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    platformKey: scope.platformKey,
    conversationKey: scope.conversationKey,
    updatedAt: Number(value.updatedAt) || timestamp,
    expiresAt: value.expiresAt,
    groups: value.groups.filter((group) => group && typeof group.groupKey === "string"),
    makers: value.makers.filter((maker) => maker
      && typeof maker.makerKey === "string"
      && typeof maker.sourceMessageKey === "string"
      && maker.sourceMessageKey)
  };
}

function normalizeLegacySnapshot(value, conversationKey, timestamp) {
  if (!value
    || value.schemaVersion !== LEGACY_SCHEMA_VERSION
    || value.conversationKey !== conversationKey
    || !Number.isFinite(value.expiresAt)
    || value.expiresAt <= timestamp
    || !Array.isArray(value.groups)
    || !Array.isArray(value.makers)) {
    return null;
  }
  return value;
}

function byteLength(value) {
  return new TextEncoder().encode(JSON.stringify(value)).length;
}

function sameLocator(left, right) {
  return Boolean(left.sourceMessageKey)
    && (left.sourceMessageKey === right.sourceMessageKey
      || right.sourceMessageAliases.includes(left.sourceMessageKey))
    && left.canonicalKind === right.canonicalKind
    && left.ordinalWithinKind === right.ordinalWithinKind;
}

function exactLocator(left, right) {
  return sameLocator(left, right) && left.titleFingerprint === right.titleFingerprint;
}

function pendingLocator(left, right) {
  return !left.sourceMessageKey
    && left.groupKey === right.groupKey
    && left.canonicalKind === right.canonicalKind
    && left.ordinalWithinKind === right.ordinalWithinKind;
}

function exactPendingLocator(left, right) {
  return pendingLocator(left, right) && left.titleFingerprint === right.titleFingerprint;
}

function persistedGroup(group) {
  const { element: _element, title: _title, ...record } = group;
  return {
    ...record,
    previewTitle: typeof group.previewTitle === "string"
      ? group.previewTitle.slice(0, MAX_USER_PREVIEW_LENGTH)
      : ""
  };
}

function serializableMaker(maker) {
  const { element: _element, sourceMessageAliases: _sourceMessageAliases, ...record } = maker;
  return record;
}

function sourceAliasEntries(value) {
  if (value instanceof Map) {
    return [...value.entries()];
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return Object.entries(value);
  }
  return [];
}

function normalizedObservation(observation) {
  const rawMakers = Array.isArray(observation.makers) ? observation.makers : [];
  const sourceKeysByAlias = new Map();
  const aliasesBySourceKey = new Map();
  const registerAliases = (sourceMessageKey, aliases) => {
    if (!sourceMessageKey || !Array.isArray(aliases)) {
      return;
    }
    const sourceAliases = aliasesBySourceKey.get(sourceMessageKey) || new Set();
    [...new Set(aliases)].filter(Boolean).forEach((alias) => {
      sourceAliases.add(alias);
      const sourceKeys = sourceKeysByAlias.get(alias) || new Set();
      sourceKeys.add(sourceMessageKey);
      sourceKeysByAlias.set(alias, sourceKeys);
    });
    aliasesBySourceKey.set(sourceMessageKey, sourceAliases);
  };
  sourceAliasEntries(observation.sourceMessageAliases)
    .forEach(([sourceMessageKey, aliases]) => registerAliases(sourceMessageKey, aliases));
  rawMakers.forEach((maker) => {
    registerAliases(maker.sourceMessageKey, maker.sourceMessageAliases);
  });
  const unambiguousAliasesBySourceKey = new Map(
    [...aliasesBySourceKey.entries()].map(([sourceMessageKey, aliases]) => [
      sourceMessageKey,
      [...aliases].filter((alias) => sourceKeysByAlias.get(alias)?.size === 1)
    ])
  );
  return {
    coverage: observation.coverage === "partial" ? "partial" : "complete",
    authoritativeMessageKeys: Array.isArray(observation.authoritativeMessageKeys)
      ? observation.authoritativeMessageKeys
      : null,
    mountedMessageKeys: observation.mountedMessageKeys || [],
    groups: observation.groups || [],
    sourceMessageAliases: unambiguousAliasesBySourceKey,
    makers: rawMakers.map((maker) => ({
      ...maker,
      sourceMessageAliases: unambiguousAliasesBySourceKey.get(maker.sourceMessageKey) || []
    }))
  };
}

function mergePartialRecords(cachedRecords, observedRecords, keyFor) {
  const recordByKey = new Map(cachedRecords.map((record) => [keyFor(record), record]));
  observedRecords.forEach((record) => recordByKey.set(keyFor(record), record));
  const orderedKeys = cachedRecords.map(keyFor);

  observedRecords.forEach((record, observedIndex) => {
    const recordKey = keyFor(record);
    if (orderedKeys.includes(recordKey)) {
      return;
    }
    let insertionIndex = -1;
    for (let index = observedIndex - 1; index >= 0; index -= 1) {
      const previousIndex = orderedKeys.indexOf(keyFor(observedRecords[index]));
      if (previousIndex >= 0) {
        insertionIndex = previousIndex + 1;
        break;
      }
    }
    if (insertionIndex < 0) {
      for (let index = observedIndex + 1; index < observedRecords.length; index += 1) {
        const nextIndex = orderedKeys.indexOf(keyFor(observedRecords[index]));
        if (nextIndex >= 0) {
          insertionIndex = nextIndex;
          break;
        }
      }
    }
    orderedKeys.splice(insertionIndex < 0 ? orderedKeys.length : insertionIndex, 0, recordKey);
  });

  return orderedKeys.map((recordKey, order) => ({ ...recordByKey.get(recordKey), order }));
}

export function createChromeStorageAdapter(storageArea) {
  return {
    get(keys) {
      return storageArea.get(keys);
    },
    set(items) {
      return storageArea.set(items);
    },
    remove(keys) {
      return storageArea.remove(keys);
    }
  };
}

export function createMakerSnapshotModel({
  storage,
  createKey = () => `maker-${crypto.randomUUID()}`,
  now = () => Date.now(),
  setTimer = (callback, delay) => setTimeout(callback, delay),
  clearTimer = (timer) => clearTimeout(timer),
  ttlMs = DEFAULT_TTL_MS,
  maxConversations = DEFAULT_MAX_CONVERSATIONS,
  maxBytes = DEFAULT_MAX_BYTES,
  writeDelayMs = DEFAULT_WRITE_DELAY_MS,
  onError = () => {}
}) {
  let activeScope = { platformKey: "", conversationKey: "", persistence: false };
  let activationToken = 0;
  let snapshot = null;
  let bindings = new Map();
  let runtimeGroupTitles = new Map();
  let pendingMakers = [];
  let runtimeMakerOrders = new Map();
  let writeTimer = 0;
  let persistQueue = Promise.resolve();
  let hasPersistedMaker = false;
  const disabledPlatforms = new Set();

  function storageEnabledFor(scope = activeScope) {
    return Boolean(storage && scope.persistence && !disabledPlatforms.has(scope.platformKey));
  }

  function disablePlatform(platformKey, error) {
    disabledPlatforms.add(platformKey);
    onError(error);
  }

  function emptySnapshot(scope) {
    const timestamp = now();
    return {
      schemaVersion: SNAPSHOT_SCHEMA_VERSION,
      platformKey: scope.platformKey,
      conversationKey: scope.conversationKey,
      updatedAt: timestamp,
      expiresAt: timestamp + ttlMs,
      groups: [],
      makers: []
    };
  }

  function view() {
    if (!snapshot) {
      return { platformKey: activeScope.platformKey, conversationKey: activeScope.conversationKey, groups: [] };
    }
    const makersByGroup = new Map();
    [...snapshot.makers, ...pendingMakers].forEach((maker) => {
      const headings = makersByGroup.get(maker.groupKey) || [];
      headings.push({
        ...maker,
        order: runtimeMakerOrders.get(maker.makerKey) ?? maker.order,
        element: bindings.get(maker.makerKey) || null,
        id: `polaris-${maker.makerKey}`
      });
      makersByGroup.set(maker.groupKey, headings);
    });
    makersByGroup.forEach((makers) => makers.sort((left, right) => left.order - right.order));

    const groups = snapshot.groups
      .map((group) => ({
        key: group.groupKey,
        user: {
          element: null,
          markerKey: group.groupKey,
          previewTitle: group.previewTitle,
          title: runtimeGroupTitles.get(group.groupKey) || group.previewTitle,
          order: group.order
        },
        headings: makersByGroup.get(group.groupKey) || [],
        hasAssistantMessage: Boolean(group.hasAssistantMessage)
      }))
      .sort((left, right) => (left.user?.order || 0) - (right.user?.order || 0));
    const orphanHeadings = makersByGroup.get("orphan") || [];
    if (orphanHeadings.length) {
      groups.push({ key: "orphan", user: null, headings: orphanHeadings });
    }
    return { platformKey: snapshot.platformKey, conversationKey: snapshot.conversationKey, groups };
  }

  async function readIndex(platformKey) {
    const indexKey = indexKeyForPlatform(platformKey);
    const result = await storage.get(indexKey);
    return normalizeIndex(result[indexKey]);
  }

  async function pruneExpired(index, timestamp) {
    const expired = index.filter((entry) => entry.expiresAt <= timestamp);
    if (expired.length) {
      await storage.remove(expired.map((entry) => entry.storageKey));
    }
    return index.filter((entry) => entry.expiresAt > timestamp);
  }

  function snapshotForPersistence() {
    if (!snapshot) {
      return null;
    }
    const timestamp = now();
    return {
      ...snapshot,
      updatedAt: timestamp,
      expiresAt: timestamp + ttlMs,
      groups: snapshot.groups.map(persistedGroup),
      makers: snapshot.makers.map(serializableMaker)
    };
  }

  async function persist(savedSnapshot) {
    if (!savedSnapshot || disabledPlatforms.has(savedSnapshot.platformKey)) {
      return false;
    }
    const { platformKey, conversationKey } = savedSnapshot;
    const timestamp = savedSnapshot.updatedAt;
    const storageKey = storageKeyForConversation(platformKey, conversationKey);
    const indexKey = indexKeyForPlatform(platformKey);
    try {
      let index = await pruneExpired(await readIndex(platformKey), timestamp);
      const entry = {
        conversationKey,
        storageKey,
        updatedAt: timestamp,
        lastAccessedAt: timestamp,
        expiresAt: savedSnapshot.expiresAt,
        bytes: byteLength(savedSnapshot)
      };
      index = index.filter((item) => item.conversationKey !== conversationKey);
      if (savedSnapshot.makers.length) {
        index.push(entry);
      } else {
        await storage.remove(storageKey);
      }
      index.sort((left, right) => right.lastAccessedAt - left.lastAccessedAt);
      while (index.length > maxConversations
        || index.reduce((total, item) => total + item.bytes, 0) > maxBytes) {
        const removed = index.pop();
        if (removed) {
          await storage.remove(removed.storageKey);
        }
      }
      const isRetained = index.some((item) => item.conversationKey === conversationKey);
      if (isRetained) {
        await storage.set({ [storageKey]: savedSnapshot });
      }
      await storage.set({ [indexKey]: index });
      return isRetained;
    } catch (error) {
      disablePlatform(platformKey, error);
      return false;
    }
  }

  function enqueuePersist() {
    const savedSnapshot = snapshotForPersistence();
    const queuedActivationToken = activationToken;
    persistQueue = persistQueue.then(() => queuedActivationToken === activationToken
      ? persist(savedSnapshot)
      : undefined);
  }

  function requestPersist() {
    if (!storageEnabledFor() || !snapshot) {
      return;
    }
    if (!snapshot.makers.length) {
      if (hasPersistedMaker) {
        hasPersistedMaker = false;
        enqueuePersist();
      }
      return;
    }
    if (!hasPersistedMaker) {
      hasPersistedMaker = true;
      enqueuePersist();
      return;
    }
    clearTimer(writeTimer);
    writeTimer = setTimer(() => {
      writeTimer = 0;
      enqueuePersist();
    }, writeDelayMs);
  }

  function migrateLegacySnapshot(legacySnapshot, scope, timestamp) {
    return {
      schemaVersion: SNAPSHOT_SCHEMA_VERSION,
      platformKey: scope.platformKey,
      conversationKey: scope.conversationKey,
      updatedAt: Number(legacySnapshot.updatedAt) || timestamp,
      expiresAt: legacySnapshot.expiresAt,
      groups: legacySnapshot.groups,
      makers: legacySnapshot.makers
        .filter((maker) => maker && typeof maker.makerKey === "string" && typeof maker.assistantMessageId === "string")
        .map(({ assistantMessageId, ...maker }) => ({ ...maker, sourceMessageKey: assistantMessageId }))
    };
  }

  async function removeLegacyRecord(legacyConversationKey, legacyStorageKey) {
    const result = await storage.get(LEGACY_INDEX_KEY);
    const index = normalizeIndex(result[LEGACY_INDEX_KEY])
      .filter((entry) => entry.conversationKey !== legacyConversationKey);
    await storage.remove(legacyStorageKey);
    await storage.set({ [LEGACY_INDEX_KEY]: index });
  }

  async function tryMigrateLegacy(scope, timestamp, currentActivationToken) {
    if (scope.platformKey !== "chatgpt") {
      return null;
    }
    const legacyConversationKey = legacyConversationKeyFor(scope);
    const legacyStorageKey = legacyStorageKeyForConversation(legacyConversationKey);
    const result = await storage.get(legacyStorageKey);
    if (currentActivationToken !== activationToken) {
      return null;
    }
    const legacySnapshot = normalizeLegacySnapshot(result[legacyStorageKey], legacyConversationKey, timestamp);
    if (!legacySnapshot) {
      if (result[legacyStorageKey]) {
        await removeLegacyRecord(legacyConversationKey, legacyStorageKey);
      }
      return null;
    }
    const migrated = migrateLegacySnapshot(legacySnapshot, scope, timestamp);
    if (await persist(migrated) && currentActivationToken === activationToken) {
      await removeLegacyRecord(legacyConversationKey, legacyStorageKey);
      return migrated;
    }
    return null;
  }

  async function open(scopeValue) {
    activationToken += 1;
    const currentActivationToken = activationToken;
    clearTimer(writeTimer);
    writeTimer = 0;
    bindings = new Map();
    runtimeGroupTitles = new Map();
    pendingMakers = [];
    runtimeMakerOrders = new Map();
    activeScope = normalizeScope(scopeValue);
    const openedScope = activeScope;
    snapshot = emptySnapshot(openedScope);
    hasPersistedMaker = false;
    if (!storageEnabledFor()) {
      return view();
    }

    const timestamp = now();
    const storageKey = storageKeyForConversation(openedScope.platformKey, openedScope.conversationKey);
    const indexKey = indexKeyForPlatform(openedScope.platformKey);
    try {
      let index = await pruneExpired(await readIndex(openedScope.platformKey), timestamp);
      const result = await storage.get(storageKey);
      let restored = normalizeSnapshot(result[storageKey], openedScope, timestamp);
      if (currentActivationToken !== activationToken) {
        return view();
      }
      if (!restored && result[storageKey]) {
        await storage.remove(storageKey);
        index = index.filter((entry) => entry.conversationKey !== openedScope.conversationKey);
      }
      if (!restored) {
        restored = await tryMigrateLegacy(openedScope, timestamp, currentActivationToken);
      }
      if (currentActivationToken !== activationToken) {
        return view();
      }
      if (restored) {
        snapshot = restored;
        hasPersistedMaker = snapshot.makers.length > 0;
        const storedIndex = await storage.get(indexKey);
        index = normalizeIndex(storedIndex[indexKey]);
        index = index.map((entry) => entry.conversationKey === openedScope.conversationKey
          ? { ...entry, lastAccessedAt: timestamp }
          : entry);
      }
      await storage.set({ [indexKey]: index });
    } catch (error) {
      disablePlatform(openedScope.platformKey, error);
    }
    return view();
  }

  function reconcile(rawObservation) {
    if (!snapshot) {
      return view();
    }
    const observation = normalizedObservation(rawObservation);
    const timestamp = now();
    const mountedMessageKeys = new Set(observation.mountedMessageKeys);
    const observedSourceKeys = new Set(observation.makers.map((maker) => maker.sourceMessageKey).filter(Boolean));
    const authoritativeMessageKeys = observation.authoritativeMessageKeys === null
      ? null
      : new Set(observation.authoritativeMessageKeys);
    const canonicalSourceKeyByAlias = new Map();
    observation.sourceMessageAliases.forEach((aliases, sourceMessageKey) => {
      aliases.forEach((alias) => canonicalSourceKeyByAlias.set(alias, sourceMessageKey));
    });
    snapshot.makers = snapshot.makers.map((maker) => {
      const migratedSourceMessageKey = canonicalSourceKeyByAlias.get(maker.sourceMessageKey);
      return migratedSourceMessageKey
        ? { ...maker, sourceMessageKey: migratedSourceMessageKey }
        : maker;
    });
    const cachedMakers = snapshot.makers;
    const reusableMakers = [...snapshot.makers, ...pendingMakers];
    const claimedKeys = new Set();
    const nextBindings = new Map();
    const nextPendingMakers = [];
    const observedPersistentMakers = [];
    const observedRuntimeMakers = [];

    runtimeGroupTitles = new Map(observation.groups.map((group) => [group.groupKey, group.title]));
    const observedGroups = observation.groups.map((group) => ({
      groupKey: group.groupKey,
      userMessageKey: group.userMessageKey || group.userMessageId || "",
      previewTitle: group.previewTitle,
      order: group.order,
      hasAssistantMessage: Boolean(group.hasAssistantMessage)
    }));
    if (observation.coverage === "complete") {
      snapshot.groups = observedGroups.map((group, order) => ({ ...group, order }));
    } else {
      snapshot.groups = mergePartialRecords(
        snapshot.groups,
        observedGroups,
        (group) => group.groupKey
      );
    }

    observation.makers.forEach((maker) => {
      const candidates = reusableMakers.filter((candidate) => !claimedKeys.has(candidate.makerKey));
      const matched = candidates.find((candidate) => exactLocator(candidate, maker))
        || candidates.find((candidate) => sameLocator(candidate, maker))
        || candidates.find((candidate) => exactPendingLocator(candidate, maker))
        || candidates.find((candidate) => pendingLocator(candidate, maker));
      const makerKey = matched?.makerKey || createKey();
      claimedKeys.add(makerKey);
      const nextMaker = {
        makerKey,
        groupKey: maker.groupKey || "orphan",
        sourceMessageKey: maker.sourceMessageKey,
        canonicalKind: maker.canonicalKind,
        ordinalWithinKind: maker.ordinalWithinKind,
        titleFingerprint: maker.titleFingerprint,
        title: maker.title,
        level: maker.level,
        sourceType: maker.sourceType,
        order: maker.order,
        lastKnownScrollRatio: maker.lastKnownScrollRatio,
        lastSeenAt: timestamp
      };
      if (maker.element) {
        nextBindings.set(makerKey, maker.element);
      }
      if (maker.sourceMessageKey) {
        observedPersistentMakers.push(nextMaker);
      } else {
        nextPendingMakers.push(nextMaker);
      }
      observedRuntimeMakers.push(nextMaker);
    });

    let retainedMakers = snapshot.makers;
    if (authoritativeMessageKeys) {
      retainedMakers = retainedMakers.filter((maker) => authoritativeMessageKeys.has(maker.sourceMessageKey));
    } else if (observation.coverage === "complete") {
      retainedMakers = retainedMakers.filter((maker) => observedSourceKeys.has(maker.sourceMessageKey));
    }
    const nextPersistentMakers = [
      ...retainedMakers.filter((maker) => (
        !claimedKeys.has(maker.makerKey)
        && !mountedMessageKeys.has(maker.sourceMessageKey)
      )),
      ...observedPersistentMakers
    ];
    if (observation.coverage === "partial") {
      const nextMakerKeys = new Set(nextPersistentMakers.map((maker) => maker.makerKey));
      snapshot.makers = mergePartialRecords(
        cachedMakers.filter((maker) => nextMakerKeys.has(maker.makerKey)),
        observedPersistentMakers,
        (maker) => maker.makerKey
      );
    } else {
      snapshot.makers = nextPersistentMakers;
    }
    const runtimeMakers = observation.coverage === "partial"
      ? mergePartialRecords(snapshot.makers, observedRuntimeMakers, (maker) => maker.makerKey)
      : [...snapshot.makers, ...nextPendingMakers]
        .sort((left, right) => left.order - right.order)
        .map((maker, order) => ({ ...maker, order }));
    runtimeMakerOrders = new Map(runtimeMakers.map((maker) => [maker.makerKey, maker.order]));
    snapshot.updatedAt = timestamp;
    snapshot.expiresAt = timestamp + ttlMs;
    bindings = nextBindings;
    pendingMakers = nextPendingMakers;
    requestPersist();
    return view();
  }

  function resolveElement(makerKey) {
    const element = bindings.get(makerKey);
    return element?.isConnected === false ? null : element || null;
  }

  function close() {
    activationToken += 1;
    clearTimer(writeTimer);
    writeTimer = 0;
    activeScope = { platformKey: "", conversationKey: "", persistence: false };
    snapshot = null;
    bindings = new Map();
    runtimeGroupTitles = new Map();
    pendingMakers = [];
    runtimeMakerOrders = new Map();
  }

  return { open, reconcile, resolveElement, close };
}
