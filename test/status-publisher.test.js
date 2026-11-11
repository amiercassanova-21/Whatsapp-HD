// SPDX-License-Identifier: GPL-3.0-only OR AGPL-3.0-only
// Copyright (C) 2026 amiercassanova-21

import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { publishStatus } from "../src/status-publisher.js";
import { SERVER_ACK_EVENT } from "../src/server-ack.js";
import { imageFile, temporary } from "./helpers.js";

function fakeSocket({ ackAttrs, ackDuringSend = false, withWs = true } = {}) {
  const ws = new EventEmitter();
  const socket = { user: { id: "62811111111:12@s.whatsapp.net" }, sendMessage: async () => {
    const frame = ackAttrs && { tag: "ack", attrs: { class: "message", id: "MSG1", from: "status@broadcast", ...ackAttrs } };
    if (frame && ackDuringSend) ws.emit(SERVER_ACK_EVENT, frame);
    else if (frame) setTimeout(() => ws.emit(SERVER_ACK_EVENT, frame), 10);
    return { key: { id: "MSG1" } };
  } };
  if (withWs) socket.ws = ws;
  return { socket, ws };
}
const upload = async (t, socket, ackTimeoutMs = 2000) => publishStatus(socket, { uploadPath: await imageFile(await temporary(t)), caption: "", statusRecipients: ["62822222222@s.whatsapp.net"], ackTimeoutMs });

test("upload succeeds after the server ack arrives", async (t) => {
  const { socket, ws } = fakeSocket({ ackAttrs: { count: "2" } });
  assert.equal((await upload(t, socket)).key.id, "MSG1");
  assert.equal(ws.listenerCount(SERVER_ACK_EVENT), 0);
});

test("an ack that arrives while sendMessage is still running is not missed", async (t) => {
  const { socket } = fakeSocket({ ackAttrs: {}, ackDuringSend: true });
  assert.equal((await upload(t, socket)).key.id, "MSG1");
});

test("upload fails when the server ack reports an error", async (t) => {
  const { socket, ws } = fakeSocket({ ackAttrs: { error: "479" } });
  await assert.rejects(upload(t, socket), /rejected the Status \(error 479\)/);
  assert.equal(ws.listenerCount(SERVER_ACK_EVENT), 0);
});

test("upload fails when no server ack arrives in time", async (t) => {
  const { socket, ws } = fakeSocket();
  await assert.rejects(upload(t, socket, 50), /No WhatsApp server confirmation/);
  assert.equal(ws.listenerCount(SERVER_ACK_EVENT), 0);
});

test("sockets without a WebSocket client keep the previous behavior", async (t) => {
  const { socket } = fakeSocket({ withWs: false });
  assert.equal((await upload(t, socket)).key.id, "MSG1");
});
