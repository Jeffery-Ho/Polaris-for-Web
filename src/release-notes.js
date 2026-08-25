const RELEASE_NOTES = Object.freeze([
  {
    version: "0.28.5",
    en: {
      title: "Clearer unloaded-reply feedback",
      changes: ["ChatGPT history groups without a loaded reply now explain how to load it."]
    },
    zh: {
      title: "未加载回复提示更明确",
      changes: ["ChatGPT 历史分组没有已加载回复时，会提示如何加载后重试。"]
    }
  },
  {
    version: "0.28.6",
    en: {
      title: "Updated Doubao message recognition",
      changes: ["Polaris recognizes Doubao's current sent-message bubbles again."]
    },
    zh: {
      title: "适配豆包新版消息识别",
      changes: ["Polaris 已重新识别豆包新版发送消息气泡。"]
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
    version: "0.29.1",
    en: {
      title: "Friendlier update notice",
      changes: ["Adds the Polaris app icon, friendlier emoji cues, and a visually centered close control."]
    },
    zh: {
      title: "更新弹窗更亲切",
      changes: ["标题新增 Polaris 应用小图标和 Emoji 提示，关闭按钮的 xmark 已居中对齐。"]
    }
  },
  {
    version: "0.29.2",
    en: {
      title: "Newest updates first",
      changes: ["Release notes now appear in descending version order."]
    },
    zh: {
      title: "更新说明最新优先",
      changes: ["更新说明现在按版本倒序展示。"]
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
  if (lastSeenVersion === currentVersion) {
    return [];
  }

  const notes = RELEASE_NOTES
    .filter(({ version }) => compareVersions(version, currentVersion) <= 0)
    .filter(({ version }) => !lastSeenVersion || compareVersions(version, lastSeenVersion) > 0)
    .sort((first, second) => compareVersions(first.version, second.version));

  if (!notes.some(({ version }) => version === currentVersion)) {
    notes.push(fallbackReleaseNote(currentVersion));
  }

  return notes.slice(-maximumNotes).reverse();
}
