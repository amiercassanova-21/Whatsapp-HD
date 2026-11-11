// SPDX-License-Identifier: GPL-3.0-only OR AGPL-3.0-only
// Copyright (C) 2026 amiercassanova-21
// Part of a modified version of Whatsapp-HD by XurXuo (DamnSit), added
// 2026-11-11: wait for WhatsApp's server ack before treating a Status upload
// as published.

// Baileys emits every incoming frame on its WebSocket client as
// `CB:<tag>,<attr>:<value>`. The server answers a sent message with
// <ack class="message" id="…"/>, carrying `error` when it was rejected.
export const SERVER_ACK_EVENT = "CB:ack,class:message";
export const DEFAULT_ACK_TIMEOUT_MS = 90000;

export function ackTimeoutFromEnv(env = process.env) {
  const value = Number(env.WA_ACK_TIMEOUT_MS);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_ACK_TIMEOUT_MS;
}

// Start listening before the message is sent, because the ack can arrive
// immediately after the frame is written. Returns null when the socket does
// not expose its WebSocket client (for example, mocked sockets in tests).
export function watchServerAcks(socket) {
  const ws = socket?.ws;
  if (!ws || typeof ws.on !== "function" || typeof ws.off !== "function") return null;
  const received = new Map();
  const waiting = new Map();
  const handler = (node) => {
    const attrs = node?.attrs;
    if (!attrs?.id) return;
    const resolve = waiting.get(attrs.id);
    if (resolve) resolve(attrs);
    else received.set(attrs.id, attrs);
  };
  ws.on(SERVER_ACK_EVENT, handler);
  let closed = false;
  return {
    wait(id, timeoutMs = DEFAULT_ACK_TIMEOUT_MS) {
      if (received.has(id)) return Promise.resolve(received.get(id));
      if (closed) return Promise.resolve(null);
      return new Promise((resolve) => {
        const timer = setTimeout(() => { waiting.delete(id); resolve(null); }, timeoutMs);
        waiting.set(id, (attrs) => { clearTimeout(timer); waiting.delete(id); resolve(attrs); });
      });
    },
    close() {
      if (closed) return;
      closed = true;
      ws.off(SERVER_ACK_EVENT, handler);
      for (const resolve of waiting.values()) resolve(null);
      waiting.clear();
      received.clear();
    }
  };
}
