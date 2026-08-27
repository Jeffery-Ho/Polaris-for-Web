const RELEASE_NOTES = Object.freeze([
  {
    version: "0.39.0",
    en: {
      title: "A support entry in settings",
      changes: ["A heart button at the right edge of the Polaris settings header opens the support page in a new tab."]
    },
    zh: {
      title: "修正赞赏入口位置",
      changes: ["Polaris 设置面板 Header 右侧新增心形入口，可在新标签页打开赞赏页。"]
    }
  },
  {
    version: "0.38.0",
    en: {
      title: "A new Polaris support page",
      changes: ["The Polaris website now includes a focused support page with the extension link, issue tracker, introduction video area, and a direct PayPal option."]
    },
    zh: {
      title: "新增 Polaris 赞赏页",
      changes: ["Polaris 网站新增独立赞赏页，集中提供扩展入口、问题反馈、介绍视频区域和 PayPal 直达入口。"]
    }
  },
  {
    version: "0.37.0",
    en: {
      title: "Stable Maker lists while streaming",
      changes: ["Existing Makers stay stable while responses stream, so the list remains scrollable and collapsible; wheel, trackpad, or list-drag input takes control immediately so Makers can remain outside the visible list without being pulled back."]
    },
    zh: {
      title: "Maker 列表流式稳定化",
      changes: ["回答流式生成时复用已有 Maker，列表仍可持续滚动与折叠；滚轮、触摸板或列表拖动会立即接管滚动，Maker 可保持在列表不可见区域，不再闪烁或被自动拉回。"]
    }
  },
  {
    version: "0.36.0",
    en: {
      title: "Progressive Maker rendering",
      changes: ["Makers now appear during streaming output as soon as the first valid section is available, without waiting for the response to finish."]
    },
    zh: {
      title: "Maker 流式渐进渲染",
      changes: ["流式输出识别到首个有效 Maker 后即开始渐进渲染，不再等待整段回答结束。"]
    }
  },
  {
    version: "0.35.0",
    en: {
      title: "Table markers across AI chats",
      changes: ["Visible response tables now create one navigation marker from their first row on every supported platform."]
    },
    zh: {
      title: "全平台表格 Maker",
      changes: ["所有支持平台的可见回复表格现在都会按首行生成一个导航 Maker。"]
    }
  },
  {
    version: "0.34.0",
    en: {
      title: "Mixed raw Markdown chapters",
      changes: ["Chapter View now safely formats raw mixed Markdown, including nested task lists, inline styles, code, tables, and Unicode characters."]
    },
    zh: {
      title: "章节支持混排 Markdown 与特殊字符",
      changes: ["章节视图现可安全格式化原始混排 Markdown，支持嵌套任务列表、行内格式、代码、表格及 Unicode 特殊字符。"]
    }
  },
  {
    version: "0.33.0",
    en: {
      title: "Raw Markdown tables in chapters",
      changes: ["Chapter View now formats complete pipe tables even when the source page leaves them as raw Markdown text."]
    },
    zh: {
      title: "章节支持原始 Markdown 表格",
      changes: ["网页未渲染的完整管道表格现在会在章节视图中格式化显示。"]
    }
  },
  {
    version: "0.32.0",
    en: {
      title: "Jump back to empty chapters",
      changes: ["Empty Chapter View sections can now take you directly to their original conversation position."]
    },
    zh: {
      title: "空章节可跳回原会话",
      changes: ["没有可显示正文的章节现在可直接跳转到其在原会话中的位置。"]
    }
  },
  {
    version: "0.31.0",
    en: {
      title: "Richer Markdown chapters",
      changes: ["Chapter View now renders headings, task lists, images, nested content, and complex tables safely."]
    },
    zh: {
      title: "更完整的 Markdown 章节阅读",
      changes: ["章节视图现可安全渲染标题、任务列表、图片、嵌套内容与复杂表格。"]
    }
  },
  {
    version: "0.29.0",
    en: {
      title: "What's new notifications",
      changes: ["A version update dialog now summarizes changes and provides direct feedback options."]
    },
    zh: {
      title: "新增版本更新通知",
      changes: ["版本更新弹窗会说明本次改动，并提供直接反馈入口。"]
    }
  },
  {
    version: "0.30.0",
    en: {
      title: "Review updates anytime",
      changes: ["About & Settings now provides a nearby entry to reopen update notes."]
    },
    zh: {
      title: "随时查看更新说明",
      changes: ["关于与设置面板在版本号旁新增入口，可再次查看更新说明。"]
    }
  }
]);

function compareVersions(first, second) {
  const firstSegments = String(first).split(".").map(Number);
  const secondSegments = String(second).split(".").map(Number);
  const segmentCount = Math.max(firstSegments.length, secondSegments.length);

  for (let index = 0; index < segmentCount; index += 1) {
    const difference = (firstSegments[index] || 0) - (secondSegments[index] || 0);
    if (difference) {
      return difference;
    }
  }

  return 0;
}

function minorVersion(version) {
  return String(version).split(".").slice(0, 2).join(".");
}

export function isFeatureVersion(version) {
  const segments = String(version).split(".");
  return segments.length === 3 && segments.every((segment) => /^\d+$/.test(segment)) && segments[2] === "0";
}

function fallbackReleaseNote(version) {
  return {
    isFallback: true,
    version,
    en: {
      title: "Release notes unavailable",
      changes: ["Detailed notes for this version are unavailable. Please send feedback if something needs attention."]
    },
    zh: {
      title: "更新说明暂不可用",
      changes: ["此版本的详细更新说明暂不可用；如有问题，请通过下方入口反馈。"]
    }
  };
}

export function releaseNotesForUpdate(lastSeenVersion, currentVersion, maximumNotes = 3) {
  const currentMinorVersion = minorVersion(currentVersion);
  const lastSeenMinorVersion = lastSeenVersion ? minorVersion(lastSeenVersion) : "";
  if (lastSeenMinorVersion === currentMinorVersion) {
    return [];
  }

  const notes = RELEASE_NOTES
    .filter(({ version }) => isFeatureVersion(version))
    .filter(({ version }) => compareVersions(minorVersion(version), currentMinorVersion) <= 0)
    .filter(({ version }) => !lastSeenMinorVersion || compareVersions(minorVersion(version), lastSeenMinorVersion) > 0)
    .sort((first, second) => compareVersions(first.version, second.version));

  if (!notes.some(({ version }) => minorVersion(version) === currentMinorVersion)) {
    notes.push(fallbackReleaseNote(currentMinorVersion));
  }

  return notes.slice(-maximumNotes).reverse().map((note) => ({
    ...note,
    version: minorVersion(note.version)
  }));
}
