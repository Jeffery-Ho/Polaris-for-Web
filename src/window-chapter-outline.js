function chapterLevel(chapter) {
  const level = Number(chapter?.level);
  const semanticLevel = Number.isFinite(level) && level > 0 ? level : 1;
  return semanticLevel + (chapter?.isListItem ? 1 : 0);
}

export function buildWindowChapterOutline(chapters = []) {
  const outlined = [];
  let stack = [];
  let activeContainer = null;

  chapters.forEach((chapter) => {
    const containerKey = String(chapter?.containerKey || "");
    const level = chapterLevel(chapter);
    if (containerKey !== activeContainer) {
      activeContainer = containerKey;
      stack = [];
    }
    while (stack.length && stack.at(-1).level >= level) stack.pop();
    const parent = stack.at(-1) || null;
    const item = {
      ...chapter,
      containerKey,
      sourceLevel: Number(chapter?.level) || 1,
      level,
      depth: parent ? parent.depth + 1 : 0,
      parentKey: parent?.markerKey || ""
    };
    outlined.push(item);
    stack.push(item);
  });

  return outlined.map((chapter, index) => {
    let endIndex = outlined.length;
    for (let nextIndex = index + 1; nextIndex < outlined.length; nextIndex += 1) {
      const next = outlined[nextIndex];
      if (next.containerKey !== chapter.containerKey || next.level <= chapter.level) {
        endIndex = nextIndex;
        break;
      }
    }
    return { ...chapter, endIndex };
  });
}

export function chapterSelectionIdentity(chapters = [], chapter = null) {
  if (!chapter) return null;
  return {
    markerKey: chapter.markerKey || "",
    title: chapter.title || "",
    parentPath: chapterParentPath(chapters, chapter)
  };
}

export function resolveSelectedChapterKey(chapters = [], preferredKey = "", preferredChapter = null) {
  if (preferredKey && chapters.some((chapter) => chapter.markerKey === preferredKey)) {
    return preferredKey;
  }
  if (preferredChapter?.title) {
    const titleMatches = chapters.filter((chapter) => chapter.title === preferredChapter.title);
    const pathMatch = titleMatches.find((chapter) => (
      chapterParentPath(chapters, chapter) === (preferredChapter.parentPath || "")
    ));
    if (pathMatch) return pathMatch.markerKey || "";
    if (titleMatches.length === 1) return titleMatches[0].markerKey || "";
  }
  return chapters[0]?.markerKey || "";
}

export function chapterParentPath(chapters = [], chapter = null) {
  const byKey = new Map(chapters.map((item) => [item.markerKey, item]));
  const titles = [];
  const seen = new Set();
  let parentKey = chapter?.parentKey || "";
  while (parentKey && !seen.has(parentKey)) {
    seen.add(parentKey);
    const parent = byKey.get(parentKey);
    if (!parent) break;
    titles.unshift(parent.title);
    parentKey = parent.parentKey || "";
  }
  return titles.join(" / ");
}
