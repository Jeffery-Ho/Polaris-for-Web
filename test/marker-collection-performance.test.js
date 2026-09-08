import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const contentSource = await readFile(new URL("../src/content.js", import.meta.url), "utf8");

function functionSource(name, nextName) {
  const start = contentSource.indexOf(`  function ${name}(`);
  const end = contentSource.indexOf(`  function ${nextName}(`, start);
  return contentSource.slice(start, end);
}

test("Maker 标题候选每个 assistant 容器只查询一次并保持识别优先级", () => {
  const collect = functionSource("collectHeadings", "debugCollection");
  const candidateQueryCount = (collect.match(/container\.querySelectorAll\(/g) || []).length;
  const priorityChecks = [
    'heading.matches(`${HEADING_SELECTOR}, ${ROLE_HEADING_SELECTOR}`)',
    "heading.matches(STRONG_HEADING_SELECTOR)",
    "heading.matches(NUMBERED_HEADING_SELECTOR)",
    'heading.matches("ul > li")',
    'heading.matches("ol > li")'
  ];

  assert.equal(candidateQueryCount, 1);
  assert.match(contentSource, /const MARKER_CANDIDATE_SELECTOR = \[/);
  priorityChecks.reduce((previousIndex, expression) => {
    const currentIndex = collect.indexOf(expression);
    assert.ok(currentIndex > previousIndex, `${expression} must keep candidate priority`);
    return currentIndex;
  }, -1);
});
