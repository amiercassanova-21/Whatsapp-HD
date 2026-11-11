// SPDX-License-Identifier: GPL-3.0-only OR AGPL-3.0-only
// Copyright (C) 2026 amiercassanova-21

import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { SERVER_ACK_EVENT, ackTimeoutFromEnv, DEFAULT_ACK_TIMEOUT_MS, watchServerAcks } from "../src/server-ack.js";

const ack = (attrs) => ({ tag: "ack", attrs: { class: "message", ...attrs } });

test("returns null when the socket has no WebSocket client", () => {
  assert.equal(watchServerAcks({}), null);
  assert.equal(watchServerAcks(undefined), null);
  assert.equal(watchServerAcks({ ws: {} }), null);
});

test("resolves with the ack that matches the message id", async () => {
  const ws = new EventEmitter(); const acks = watchServerAcks({ ws });
  const pending = acks.wait("ID1", 1000);
  ws.emit(SERVER_ACK_EVENT, ack({ id: "OTHER" }));
  ws.emit(SERVER_ACK_EVENT, ack({ id: "ID1", from: "status@broadcast", count: "104" }));
  assert.equal((await pending).count, "104");
  acks.close(); assert.equal(ws.listenerCount(SERVER_ACK_EVENT), 0);
});

test("keeps an ack that arrives before waiting starts", async () => {
  const ws = new EventEmitter(); const acks = watchServerAcks({ ws });
  ws.emit(SERVER_ACK_EVENT, ack({ id: "EARLY", error: "479" }));
  assert.equal((await acks.wait("EARLY", 10)).error, "479");
  acks.close();
});

test("resolves null on timeout and when closed", async () => {
  const ws = new EventEmitter(); const acks = watchServerAcks({ ws });
  assert.equal(await acks.wait("MISSING", 20), null);
  const pending = acks.wait("LATER", 10000); acks.close();
  assert.equal(await pending, null);
  assert.equal(await acks.wait("AFTER", 10000), null);
});

test("reads a positive timeout from WA_ACK_TIMEOUT_MS", () => {
  assert.equal(ackTimeoutFromEnv({ WA_ACK_TIMEOUT_MS: "1500" }), 1500);
  for (const value of [undefined, "", "0", "-5", "abc"]) assert.equal(ackTimeoutFromEnv({ WA_ACK_TIMEOUT_MS: value }), DEFAULT_ACK_TIMEOUT_MS);
});
