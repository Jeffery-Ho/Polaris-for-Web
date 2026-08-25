import test from "node:test";
import assert from "node:assert/strict";

import { pageThemeFromColors } from "../src/page-theme.js";

test("uses the first opaque page surface to determine a light theme", () => {
  assert.equal(pageThemeFromColors([
    "rgba(20, 22, 30, 0.2)",
    "rgb(255, 255, 255)"
  ], "dark"), "light");
});

test("uses the first opaque page surface to determine a dark theme", () => {
  assert.equal(pageThemeFromColors(["rgb(20, 22, 30)"], "light"), "dark");
});

test("falls back when page surfaces are transparent or unavailable", () => {
  assert.equal(pageThemeFromColors(["transparent", "rgba(0, 0, 0, 0.2)"], "dark"), "dark");
});
