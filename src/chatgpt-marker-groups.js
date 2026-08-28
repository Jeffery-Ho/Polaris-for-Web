export function createChatGPTSourceIdentityIndex(conversation, adapter) {
  const sourceMessageKeyByAssistantId = new Map();
  const sourceMessageKeysByUserId = new Map();
  const sourceMessageAliasesBySourceKey = new Map();
  const assistantOrdinalByUserId = new Map();
  const authoritativeMessageKeys = [];

  (conversation.activeAssistantMessageIds || []).forEach((assistantMessageId) => {
    const userMessageId = conversation.assistantToUserMessageId?.[assistantMessageId];
    if (!userMessageId) {
      return;
    }
    const assistantOrdinal = assistantOrdinalByUserId.get(userMessageId) || 0;
    assistantOrdinalByUserId.set(userMessageId, assistantOrdinal + 1);
    const sourceMessageKey = adapter.sourceIdentity(
      null,
      `${adapter.platformKey}:user:${userMessageId}`,
      assistantOrdinal,
      { allowDerived: true }
    );
    if (!sourceMessageKey) {
      return;
    }
    sourceMessageKeyByAssistantId.set(assistantMessageId, sourceMessageKey);
    const userSourceKeys = sourceMessageKeysByUserId.get(userMessageId) || [];
    userSourceKeys.push(sourceMessageKey);
    sourceMessageKeysByUserId.set(userMessageId, userSourceKeys);
    sourceMessageAliasesBySourceKey.set(sourceMessageKey, [assistantMessageId]);
    authoritativeMessageKeys.push(sourceMessageKey);
  });

  return {
    authoritativeMessageKeys,
    sourceMessageKeyByAssistantId,
    sourceMessageKeysByUserId,
    sourceMessageAliasesBySourceKey,
    sourceMessageAliases: Object.fromEntries(sourceMessageAliasesBySourceKey)
  };
}

export function assignChatGPTAssistantIdentities({
  entries,
  conversation,
  sourceIdentityIndex,
  messageIdForElement
}) {
  const activeAssistantMessageIds = new Set(conversation.activeAssistantMessageIds || []);
  const activeUserMessageIds = new Set(
    (conversation.userMessages || []).map((message) => message.id)
  );
  const assistantIdentityByElement = new Map();
  const assistantRecordsByUserId = new Map();
  let currentUserMessageId = "";

  entries.forEach((entry) => {
    const observedMessageId = messageIdForElement(entry.element);
    if (entry.type === "user") {
      currentUserMessageId = activeUserMessageIds.has(observedMessageId) ? observedMessageId : "";
      return;
    }
    if (observedMessageId && !activeAssistantMessageIds.has(observedMessageId)) {
      assistantIdentityByElement.set(entry.element, { inactive: true });
      return;
    }
    const userMessageId = conversation.assistantToUserMessageId?.[observedMessageId]
      || currentUserMessageId;
    if (!userMessageId) {
      assistantIdentityByElement.set(entry.element, {
        inactive: false,
        sourceMessageKey: "",
        sourceMessageAliases: [],
        userMessageId: ""
      });
      return;
    }
    const records = assistantRecordsByUserId.get(userMessageId) || [];
    records.push({ element: entry.element, observedMessageId });
    assistantRecordsByUserId.set(userMessageId, records);
  });

  assistantRecordsByUserId.forEach((records, userMessageId) => {
    const sourceKeys = sourceIdentityIndex.sourceMessageKeysByUserId.get(userMessageId) || [];
    const claimedSourceKeys = new Set();
    records.forEach((record) => {
      const sourceMessageKey = sourceIdentityIndex.sourceMessageKeyByAssistantId
        .get(record.observedMessageId);
      if (!sourceMessageKey) {
        return;
      }
      claimedSourceKeys.add(sourceMessageKey);
      assistantIdentityByElement.set(record.element, {
        inactive: false,
        sourceMessageKey,
        sourceMessageAliases: sourceIdentityIndex.sourceMessageAliasesBySourceKey.get(sourceMessageKey) || [],
        userMessageId
      });
    });

    const unidentifiedRecords = records.filter((record) => !record.observedMessageId);
    const remainingSourceKeys = sourceKeys.filter((sourceMessageKey) => !claimedSourceKeys.has(sourceMessageKey));
    const canAssignByOrdinal = unidentifiedRecords.length === remainingSourceKeys.length;
    unidentifiedRecords.forEach((record, index) => {
      const sourceMessageKey = canAssignByOrdinal ? remainingSourceKeys[index] : "";
      assistantIdentityByElement.set(record.element, {
        inactive: false,
        sourceMessageKey,
        sourceMessageAliases: sourceIdentityIndex.sourceMessageAliasesBySourceKey.get(sourceMessageKey) || [],
        userMessageId
      });
    });

    records.filter((record) => record.observedMessageId
      && !assistantIdentityByElement.has(record.element))
      .forEach((record) => {
        assistantIdentityByElement.set(record.element, {
          inactive: false,
          sourceMessageKey: "",
          sourceMessageAliases: [],
          userMessageId
        });
      });
  });

  return assistantIdentityByElement;
}

export function resolveChatGPTUserMessageId({
  assistantMessageId,
  currentAssignments,
  rememberedAssignments
}) {
  if (!assistantMessageId) {
    return "";
  }

  const currentUserMessageId = currentAssignments[assistantMessageId];
  if (currentUserMessageId) {
    rememberedAssignments.set(assistantMessageId, currentUserMessageId);
    return currentUserMessageId;
  }
  return rememberedAssignments.get(assistantMessageId) || "";
}

function uniqueHeadingsInDocumentOrder(headings, headingOrder) {
  const seenElements = new Set();
  return headings
    .filter((heading) => {
      if (!heading?.element || seenElements.has(heading.element)) {
        return false;
      }
      seenElements.add(heading.element);
      return true;
    })
    .sort((left, right) => (
      (headingOrder.get(left.element) ?? Number.MAX_SAFE_INTEGER)
      - (headingOrder.get(right.element) ?? Number.MAX_SAFE_INTEGER)
    ));
}

export function recoverChatGPTMarkerGroups({ groups, previousGroups, headings }) {
  const headingOrder = new Map(headings.map((heading, index) => [heading.element, index]));
  const currentHeadingByElement = new Map(headings.map((heading) => [heading.element, heading]));
  const previousGroupByKey = new Map(previousGroups.map((group) => [group.key, group]));
  const claimedElements = new Set();
  const recoveredHeadingsByGroupKey = new Map();

  groups.filter((group) => group.user).forEach((group) => {
    group.headings.forEach((heading) => claimedElements.add(heading.element));
  });

  groups.filter((group) => group.user).forEach((group) => {
    const currentHeadings = [...group.headings];

    const previousGroup = previousGroupByKey.get(group.key);
    previousGroup?.headings.forEach((previousHeading) => {
      const currentHeading = currentHeadingByElement.get(previousHeading.element);
      if (!currentHeading
        || currentHeading.element?.isConnected !== true
        || claimedElements.has(currentHeading.element)) {
        return;
      }
      currentHeadings.push(currentHeading);
      claimedElements.add(currentHeading.element);
    });
    recoveredHeadingsByGroupKey.set(
      group.key,
      uniqueHeadingsInDocumentOrder(currentHeadings, headingOrder)
    );
  });

  return groups
    .map((group) => ({
      ...group,
      headings: group.user
        ? recoveredHeadingsByGroupKey.get(group.key) || []
        : uniqueHeadingsInDocumentOrder(
          group.headings.filter((heading) => !claimedElements.has(heading.element)),
          headingOrder
        )
    }))
    .filter((group) => group.user || group.headings.length);
}
