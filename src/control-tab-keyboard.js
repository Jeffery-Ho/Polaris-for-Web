export function nextControlTabIndex({ key, currentIndex, tabCount, isChapterModalOpen, orientation = "horizontal" }) {
  if (isChapterModalOpen) {
    return null;
  }

  const isVertical = orientation === "vertical";
  if (key === (isVertical ? "ArrowDown" : "ArrowRight")) {
    return (currentIndex + 1) % tabCount;
  }
  if (key === (isVertical ? "ArrowUp" : "ArrowLeft")) {
    return (currentIndex - 1 + tabCount) % tabCount;
  }
  if (key === "Home") {
    return 0;
  }
  if (key === "End") {
    return tabCount - 1;
  }
  return null;
}
