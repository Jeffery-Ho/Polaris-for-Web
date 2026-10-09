import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { collectSidepanelChapters } from "../src/sidepanel-chapter-content.js";
import { buildWindowChapterOutline } from "../src/window-chapter-outline.js";
import { chapterTreeText } from "../src/sidepanel-chapter-state.js";

function extract(html) {
  const doc = new JSDOM(html, { url: "https://chatgpt.com/c/test" }).window.document;
  const containers = [...doc.querySelectorAll("article")];
  const headings = containers.flatMap((container, index) => [...container.querySelectorAll("[data-level]")].map((element) => ({
    element, markerKey: element.id, title: element.dataset.title || element.textContent,
    level: Number(element.dataset.level), isListItem: element.matches("li"), containerKey: `assistant-${index}`
  })));
  return collectSidepanelChapters(containers, buildWindowChapterOutline(headings), { fullTextTitle: "正文" });
}

test("tree ranges keep introduction, duplicate sentences and descendants exactly once", () => {
  const nodes = extract('<article><p>开场</p><h1 id="a" data-level="1">父章</h1><p>相同句子</p><h3 id="b" data-level="3">子章</h3><p>相同句子</p><h2 id="c" data-level="2">同级</h2><p>结尾</p></article>');
  assert.equal(chapterTreeText(nodes), "开场\n\n父章\n\n相同句子\n\n子章\n\n相同句子\n\n同级\n\n结尾");
  assert.equal(nodes.find((node) => node.markerKey === "a").contents.filter((part) => part.type === "block").length, 1);
  assert.equal(chapterTreeText(nodes, "b"), "子章\n\n相同句子");
});
test("list marker body preserves suffix and unmarked nested lists, following prose stays with parent", () => {
  const nodes = extract('<article><h1 id="a" data-level="1">父章</h1><ul><li id="b" data-level="3" data-title="优势"><strong>优势</strong>：纸笔<ul><li>内层一</li><li>内层二</li></ul></li><li>普通条目</li></ul><p>父章收尾</p></article>');
  const full = chapterTreeText(nodes);
  for (const value of ["优势", "纸笔", "内层一", "内层二", "普通条目", "父章收尾"]) assert.equal(full.split(value).length - 1, 1, value);
  assert.ok(!chapterTreeText(nodes, "b").includes("父章收尾"));
  assert.match(nodes.find((node) => node.markerKey === "b").contents[0].html, /<ul>/);
});
test("table marker retains entire table and code without mixing separate AI replies", () => {
  const nodes = extract('<article><h1 id="a" data-level="1">比较</h1><table id="t" data-level="2" data-title="维度 / A"><tr><th>维度</th><th>A</th></tr><tr><td>价格</td><td>20</td></tr></table><pre>if (a &lt; b) {\n  run();\n}</pre></article><article><p>无标题回答</p></article>');
  const table = nodes.find((node) => node.markerKey === "t");
  assert.match(table.contents[0].html, /<table/);
  assert.ok(!chapterTreeText(nodes, "t").includes("run()"));
  assert.match(chapterTreeText(nodes), /if \(a < b\) \{\n  run\(\);/);
  assert.equal(chapterTreeText(nodes).split("无标题回答").length - 1, 1);
});
test("duplicate titles in different replies remain separate and unsafe HTML is removed", () => {
  const nodes = extract('<article><h1 id="a" data-level="1">总结</h1><p>一<script>bad()</script><button>复制</button><a href="javascript:bad()">链接</a></p></article><article><h1 id="b" data-level="1">总结</h1><p>二</p></article>');
  assert.equal(chapterTreeText(nodes).split("总结").length - 1, 2);
  assert.ok(nodes.every((node) => !node.parentKey));
  assert.ok(!JSON.stringify(nodes).includes("javascript:"));
  assert.ok(!chapterTreeText(nodes).includes("bad()"));
  assert.ok(!chapterTreeText(nodes).includes("复制"));
});
test("list marker following a table is not incorrectly owned by the table", () => {
  const nodes = extract('<article><h1 id="a" data-level="1">父章</h1><table id="t" data-level="3" data-title="表格"><tr><td>值</td></tr></table><ul><li id="b" data-level="3" data-title="列表">列表：内容</li></ul><p>收尾</p></article>');
  assert.equal(nodes.find((node) => node.markerKey === "b").parentKey, "a");
  const full = chapterTreeText(nodes);
  assert.equal(full.split("收尾").length - 1, 1);
  assert.equal(full.split("列表").length - 1, 1);
});
