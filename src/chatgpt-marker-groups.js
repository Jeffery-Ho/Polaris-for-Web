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
