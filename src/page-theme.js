export const PAGE_THEME_MEDIA_QUERY = "(prefers-color-scheme: dark)";

const PAGE_THEME_ATTRIBUTE_FILTER = Object.freeze([
  "class",
  "style",
  "data-theme",
  "data-color-mode",
  "data-color-scheme",
  "data-dark-mode"
]);

function parsedColor(value) {
  const match = String(value || "").match(/^rgba?\(\s*([\d.]+)[,\s]+\s*([\d.]+)[,\s]+\s*([\d.]+)(?:\s*[,/]\s*([\d.]+))?\s*\)$/i);
  if (!match) {
    return null;
  }

  const [, red, green, blue, alpha = "1"] = match;
  return {
    red: Number(red),
    green: Number(green),
    blue: Number(blue),
    alpha: Number(alpha)
  };
}

function relativeLuminance(channel) {
  const normalized = channel / 255;
  return normalized <= 0.04045
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

export function pageThemeFromColors(colors, fallbackTheme) {
  for (const value of colors) {
    const color = parsedColor(value);
    if (!color || color.alpha < 0.8) {
      continue;
    }

    const luminance = 0.2126 * relativeLuminance(color.red)
      + 0.7152 * relativeLuminance(color.green)
      + 0.0722 * relativeLuminance(color.blue);
    return luminance >= 0.5 ? "light" : "dark";
  }

  return fallbackTheme;
}

function pageThemeSurfaces(document) {
  return [...new Set([
    document.documentElement,
    document.body,
    document.querySelector("main"),
    document.querySelector('[role="main"]')
  ].filter(Boolean))];
}

function isPageThemeSurfaceNode(node) {
  if (!node || typeof node.matches !== "function") {
    return false;
  }

  return node.matches("main, [role=\"main\"]")
    || (typeof node.querySelector === "function" && Boolean(node.querySelector("main, [role=\"main\"]")));
}

function classNamesChanged(mutation) {
  if (typeof mutation.oldValue !== "string") {
    return [];
  }

  const previous = new Set(mutation.oldValue.split(/\s+/).filter(Boolean));
  const current = new Set(String(mutation.target.className || "").split(/\s+/).filter(Boolean));
  return [...new Set([...previous, ...current])].filter((className) => previous.has(className) !== current.has(className));
}

export function createPageThemeWatcher({
  document,
  MutationObserver: MutationObserverConstructor = globalThis.MutationObserver,
  onChange,
  window
}) {
  if (!document || !window || typeof window.matchMedia !== "function" || typeof onChange !== "function") {
    return {
      dispose() {},
      refresh() {}
    };
  }

  const mediaQueryList = window.matchMedia(PAGE_THEME_MEDIA_QUERY);
  let animationFrame = 0;
  let isDisposed = false;

  const scheduleChange = () => {
    if (isDisposed || animationFrame) {
      return;
    }

    animationFrame = window.requestAnimationFrame(() => {
      animationFrame = 0;
      if (!isDisposed) {
        onChange();
      }
    });
  };

  const mutationObserver = typeof MutationObserverConstructor === "function"
    ? new MutationObserverConstructor((mutations) => {
      const hasRelevantMutation = mutations.some((mutation) => {
        if (mutation.target !== document.documentElement || mutation.attributeName !== "class") {
          return true;
        }
        const changedClasses = classNamesChanged(mutation);
        return changedClasses.length !== 1 || changedClasses[0] !== "gpt-paragraph-nav--dragging";
      });
      if (hasRelevantMutation) {
        scheduleChange();
      }
    })
    : null;
  const structureObserver = typeof MutationObserverConstructor === "function"
    ? new MutationObserverConstructor((mutations) => {
      const hasSurfaceChange = mutations.some((mutation) => {
        if (mutation.type !== "childList") {
          return false;
        }
        if (mutation.target === document.body) {
          return true;
        }
        return [...mutation.addedNodes, ...mutation.removedNodes].some(isPageThemeSurfaceNode);
      });
      if (hasSurfaceChange) {
        refresh();
        scheduleChange();
      }
    })
    : null;
  let observedSurfaces = [];

  const refresh = () => {
    if (!mutationObserver || isDisposed) {
      return;
    }

    const surfaces = pageThemeSurfaces(document);
    if (surfaces.length === observedSurfaces.length
      && surfaces.every((surface, index) => surface === observedSurfaces[index])) {
      return;
    }

    mutationObserver.disconnect();
    surfaces.forEach((surface) => {
      mutationObserver.observe(surface, {
        attributeFilter: PAGE_THEME_ATTRIBUTE_FILTER,
        attributeOldValue: true,
        attributes: true
      });
    });
    observedSurfaces = surfaces;
  };

  refresh();
  if (structureObserver && document.documentElement) {
    structureObserver.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  let removeMediaListener = () => {};
  if (typeof mediaQueryList.addEventListener === "function") {
    mediaQueryList.addEventListener("change", scheduleChange);
    removeMediaListener = () => mediaQueryList.removeEventListener("change", scheduleChange);
  } else if (typeof mediaQueryList.addListener === "function") {
    mediaQueryList.addListener(scheduleChange);
    removeMediaListener = () => mediaQueryList.removeListener(scheduleChange);
  }

  return {
    dispose() {
      if (isDisposed) {
        return;
      }

      isDisposed = true;
      removeMediaListener();
      mutationObserver?.disconnect();
      structureObserver?.disconnect();
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      }
    },
    refresh
  };
}
