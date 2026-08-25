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
