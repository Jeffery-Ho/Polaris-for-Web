const SNAPSHOT_SCHEMA_VERSION = 1;
const SNAPSHOT_STORAGE_PREFIX = "polaris.makerSnapshot.v1:";
const SNAPSHOT_INDEX_KEY = "polaris.makerSnapshotIndex.v1";
const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const DEFAULT_MAX_CONVERSATIONS = 20;
const DEFAULT_MAX_BYTES = 2 * 1024 * 1024;
const DEFAULT_WRITE_DELAY_MS = 1000;
const MAX_USER_PREVIEW_LENGTH = 160;

function storageKeyForConversation(conversationKey) {
  return `${SNAPSHOT_STORAGE_PREFIX}${encodeURIComponent(conversationKey)}`;
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

function normalizeSnapshot(value, conversationKey, now) {
  if (!value
    || value.schemaVersion !== SNAPSHOT_SCHEMA_VERSION
    || value.conversationKey !== conversationKey
    || !Number.isFinite(value.expiresAt)
    || value.expiresAt <= now
    || !Array.isArray(value.groups)
    || !Array.isArray(value.makers)) {
    return null;
  }
  return {
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    conversationKey,
    updatedAt: Number(value.updatedAt) || now,
    expiresAt: value.expiresAt,
    groups: value.groups.filter((group) => group && typeof group.groupKey === "string"),
    makers: value.makers.filter((maker) => maker
      && typeof maker.makerKey === "string"
      && typeof maker.assistantMessageId === "string")
  };
}

function byteLength(value) {
  return new TextEncoder().encode(JSON.stringify(value)).length;
}

function sameLocator(left, right) {
  return Boolean(left.assistantMessageId)
    && left.assistantMessageId === right.assistantMessageId
    && left.canonicalKind === right.canonicalKind
    && left.ordinalWithinKind === right.ordinalWithinKind;
}

function exactLocator(left, right) {
  return sameLocator(left, right) && left.titleFingerprint === right.titleFingerprint;
}

function pendingLocator(left, right) {
  return !left.assistantMessageId
    && left.groupKey === right.groupKey
    && left.canonicalKind === right.canonicalKind
    && left.ordinalWithinKind === right.ordinalWithinKind;
}

function exactPendingLocator(left, right) {
  return pendingLocator(left, right) && left.titleFingerprint === right.titleFingerprint;
}

function persistedGroup(group) {
  return {
    ...group,
    previewTitle: typeof group.previewTitle === "string"
      ? group.previewTitle.slice(0, MAX_USER_PREVIEW_LENGTH)
      : ""
  };
}

function serializableMaker(maker) {
  const { element: _element, ...record } = maker;
  return record;
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
  let activeConversationKey = "";
  let activationToken = 0;
  let snapshot = null;
  let bindings = new Map();
  let runtimeGroupTitles = new Map();
  let pendingMakers = [];
  let writeTimer = 0;
  let persistQueue = Promise.resolve();
  let hasPersistedMaker = false;
  let storageEnabled = Boolean(storage);

  function emptySnapshot(conversationKey) {
    const timestamp = now();
    return {
      schemaVersion: SNAPSHOT_SCHEMA_VERSION,
      conversationKey,
      updatedAt: timestamp,
      expiresAt: timestamp + ttlMs,
      groups: [],
      makers: []
    };
  }

  function view() {
    if (!snapshot) {
      return { conversationKey: activeConversationKey, groups: [] };
    }
    const makersByGroup = new Map();
    [...snapshot.makers, ...pendingMakers].forEach((maker) => {
      const headings = makersByGroup.get(maker.groupKey) || [];
      headings.push({
        ...maker,
        element: bindings.get(maker.makerKey) || null,
        id: `polaris-${maker.makerKey}`
      });
      makersByGroup.set(maker.groupKey, headings);
    });
    makersByGroup.forEach((makers) => makers.sort((left, right) => left.order - right.order));

    const groups = snapshot.groups.map((group) => ({
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
    }));
    const orphanHeadings = makersByGroup.get("orphan") || [];
    if (orphanHeadings.length) {
      groups.push({ key: "orphan", user: null, headings: orphanHeadings });
    }
    return { conversationKey: snapshot.conversationKey, groups };
  }

  async function readIndex() {
    const result = await storage.get(SNAPSHOT_INDEX_KEY);
    return normalizeIndex(result[SNAPSHOT_INDEX_KEY]);
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
    if (!storageEnabled || !savedSnapshot) {
      return;
    }
    const savedConversationKey = savedSnapshot.conversationKey;
    const timestamp = savedSnapshot.updatedAt;
    const storageKey = storageKeyForConversation(savedConversationKey);
    try {
      let index = await pruneExpired(await readIndex(), timestamp);
      const entry = {
        conversationKey: savedConversationKey,
        storageKey,
        updatedAt: timestamp,
        lastAccessedAt: timestamp,
        expiresAt: savedSnapshot.expiresAt,
        bytes: byteLength(savedSnapshot)
      };
      index = index.filter((item) => item.conversationKey !== savedConversationKey);
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
      if (index.some((item) => item.conversationKey === savedConversationKey)) {
        await storage.set({ [storageKey]: savedSnapshot });
      }
      await storage.set({ [SNAPSHOT_INDEX_KEY]: index });
    } catch (error) {
      storageEnabled = false;
      onError(error);
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
    if (!storageEnabled || !snapshot) {
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

  async function open(conversationKey) {
    activationToken += 1;
    const currentActivationToken = activationToken;
    clearTimer(writeTimer);
    writeTimer = 0;
    bindings = new Map();
    runtimeGroupTitles = new Map();
    pendingMakers = [];
    activeConversationKey = conversationKey;
    snapshot = emptySnapshot(conversationKey);
    hasPersistedMaker = false;
    if (!storageEnabled) {
      return view();
    }

    const timestamp = now();
    const storageKey = storageKeyForConversation(conversationKey);
    try {
      let index = await pruneExpired(await readIndex(), timestamp);
      const result = await storage.get(storageKey);
      const restored = normalizeSnapshot(result[storageKey], conversationKey, timestamp);
      if (currentActivationToken !== activationToken || activeConversationKey !== conversationKey) {
        return view();
      }
      if (restored) {
        snapshot = restored;
        hasPersistedMaker = snapshot.makers.length > 0;
        index = index.map((entry) => entry.conversationKey === conversationKey
          ? { ...entry, lastAccessedAt: timestamp }
          : entry);
      } else if (result[storageKey]) {
        await storage.remove(storageKey);
        index = index.filter((entry) => entry.conversationKey !== conversationKey);
      }
      await storage.set({ [SNAPSHOT_INDEX_KEY]: index });
    } catch (error) {
      storageEnabled = false;
      onError(error);
    }
    return view();
  }

  function reconcile(observation) {
    if (!snapshot) {
      return view();
    }
    const timestamp = now();
    const activeAssistantIds = new Set(observation.activeAssistantMessageIds || []);
    const mountedAssistantIds = new Set(observation.mountedAssistantMessageIds || []);
    const previousMakers = snapshot.makers.filter((maker) => activeAssistantIds.has(maker.assistantMessageId));
    const reusableMakers = [...previousMakers, ...pendingMakers];
    const claimedKeys = new Set();
    const nextBindings = new Map();
    const nextPendingMakers = [];
    const observedPersistentMakers = [];

    runtimeGroupTitles = new Map((observation.groups || []).map((group) => [group.groupKey, group.title]));
    snapshot.groups = (observation.groups || []).map((group) => ({
      groupKey: group.groupKey,
      userMessageId: group.userMessageId,
      previewTitle: group.previewTitle,
      order: group.order,
      hasAssistantMessage: Boolean(group.hasAssistantMessage)
    }));

    (observation.makers || []).forEach((maker) => {
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
        assistantMessageId: maker.assistantMessageId || "",
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
      if (maker.assistantMessageId) {
        observedPersistentMakers.push(nextMaker);
      } else {
        nextPendingMakers.push(nextMaker);
      }
    });

    snapshot.makers = [
      ...previousMakers.filter((maker) => !mountedAssistantIds.has(maker.assistantMessageId)),
      ...observedPersistentMakers
    ];
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
    activeConversationKey = "";
    snapshot = null;
    bindings = new Map();
    runtimeGroupTitles = new Map();
    pendingMakers = [];
  }

  return { open, reconcile, resolveElement, close };
}
