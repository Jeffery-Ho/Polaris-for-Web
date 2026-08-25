const RELEASE_NOTES = Object.freeze([
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
