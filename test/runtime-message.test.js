import test from "node:test";
import assert from "node:assert/strict";
import { sendRuntimeMessage } from "../src/runtime-message.js";

test("runtime 消息发送器会吞掉没有接收端的 Promise 拒绝", async () => {
  const errors = [];
  const previousUnhandledRejection = process.listeners("unhandledRejection");
  process.removeAllListeners("unhandledRejection");
  process.on("unhandledRejection", (error) => errors.push(error));

  try {
    sendRuntimeMessage({
      runtime: {
        sendMessage: () => Promise.reject(new Error("Receiving end does not exist"))
      }
    }, { type: "TEST" });
    await new Promise((resolve) => setImmediate(resolve));
    assert.deepEqual(errors, []);
  } finally {
    process.removeAllListeners("unhandledRejection");
    for (const listener of previousUnhandledRejection) process.on("unhandledRejection", listener);
  }
});

test("runtime 消息发送器兼容同步异常和回调式 API", () => {
  assert.doesNotThrow(() => sendRuntimeMessage({
    runtime: { sendMessage: () => { throw new Error("Extension context invalidated"); } }
  }, { type: "TEST" }));
  assert.doesNotThrow(() => sendRuntimeMessage({
    runtime: { sendMessage: () => undefined }
  }, { type: "TEST" }));
});
