import test from "node:test";
import assert from "node:assert/strict";

import {
  diagnosticFilename,
  downloadDiagnosticLog,
  openDiagnosticEmail
} from "../src/diagnostic-export.js";

test("诊断日志下载使用 JSON Blob、download 属性并回收对象 URL", () => {
  const calls = { created: [], revoked: [], clicks: 0 };
  const body = "{\"schemaVersion\":1}";
  const urlApi = {
    createObjectURL(blob) {
      calls.created.push(blob);
      return "blob:diagnostic";
    },
    revokeObjectURL(url) {
      calls.revoked.push(url);
    }
  };
  const anchor = {
    click() {
      calls.clicks += 1;
    },
    setAttribute() {},
    remove() {}
  };
  const document = {
    createElement() {
      return anchor;
    },
    body: {
      appendChild() {}
    }
  };

  assert.equal(downloadDiagnosticLog({ document, urlApi, text: body, filename: "diagnostics.json" }), true);
  assert.equal(calls.created[0].type, "application/json");
  assert.equal(anchor.download, "diagnostics.json");
  assert.equal(anchor.href, "blob:diagnostic");
  assert.equal(calls.clicks, 1);
  assert.deepEqual(calls.revoked, ["blob:diagnostic"]);
  assert.match(diagnosticFilename(new Date("2026-09-09T01:02:03Z")), /^polaris-diagnostics-20260909-010203\.json$/);
});

test("发送诊断日志通过 mailto 传递主题和手动附加说明", () => {
  const anchor = {
    clickCount: 0,
    click() {
      this.clickCount += 1;
    },
    remove() {}
  };
  const document = {
    createElement() {
      return anchor;
    },
    body: {
      appendChild() {}
    }
  };

  assert.equal(openDiagnosticEmail({
    document,
    email: "jefferyho.build@gmail.com",
    subject: "Polaris 诊断日志",
    body: "请手动附加刚下载的 JSON 文件。"
  }), true);
  assert.equal(anchor.target, "_blank");
  assert.equal(anchor.rel, "noopener noreferrer");
  assert.match(anchor.href, /^mailto:jefferyho\.build%40gmail\.com\?subject=/);
  assert.match(anchor.href, /%E8%AF%8A%E6%96%AD%E6%97%A5%E5%BF%97/);
  assert.match(anchor.href, /%E8%AF%B7%E6%89%8B%E5%8A%A8%E9%99%84%E5%8A%A0/);
  assert.equal(anchor.clickCount, 1);
});
