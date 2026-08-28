function clampedScrollTop(scrollContainer, value) {
  const maximum = Math.max(0, scrollContainer.scrollHeight - scrollContainer.clientHeight);
  return Math.min(maximum, Math.max(0, Math.round(value)));
}

export function captureHistoricalScrollPosition({ scrollContainer, anchorElement = null, anchorKey = "" }) {
  const containerTop = scrollContainer.getBoundingClientRect().top;
  const anchorOffset = anchorElement
    ? anchorElement.getBoundingClientRect().top - containerTop
    : null;
  return {
    anchorElement,
    anchorKey,
    anchorOffset,
    scrollTop: scrollContainer.scrollTop,
    distanceFromBottom: Math.max(
      0,
      scrollContainer.scrollHeight - scrollContainer.clientHeight - scrollContainer.scrollTop
    )
  };
}

export function restoreHistoricalScrollPosition({ scrollContainer, position, resolveAnchor = () => null }) {
  const anchor = position.anchorElement?.isConnected === true
    ? position.anchorElement
    : (position.anchorKey ? resolveAnchor(position.anchorKey) : null);
  if (anchor?.isConnected !== false && typeof anchor?.getBoundingClientRect === "function"
    && Number.isFinite(position.anchorOffset)) {
    const currentOffset = anchor.getBoundingClientRect().top - scrollContainer.getBoundingClientRect().top;
    scrollContainer.scrollTo({
      top: clampedScrollTop(scrollContainer, scrollContainer.scrollTop + currentOffset - position.anchorOffset),
      behavior: "auto"
    });
    return "anchor";
  }

  if (Number.isFinite(position.distanceFromBottom)
    && Number.isFinite(scrollContainer.scrollHeight)
    && Number.isFinite(scrollContainer.clientHeight)) {
    scrollContainer.scrollTo({
      top: clampedScrollTop(
        scrollContainer,
        scrollContainer.scrollHeight - scrollContainer.clientHeight - position.distanceFromBottom
      ),
      behavior: "auto"
    });
    return "bottom-distance";
  }

  scrollContainer.scrollTo({
    top: clampedScrollTop(scrollContainer, position.scrollTop || 0),
    behavior: "auto"
  });
  return "scroll-top";
}
