// SPDX-License-Identifier: GPL-3.0-only OR AGPL-3.0-only
// Copyright (C) 2026 XurXuo (DamnSit)
// Modified 2026-11-11 by amiercassanova-21: an upload now waits for the
// WhatsApp server ack and fails when it is missing or reports an error.

import { jidNormalizedUser } from "@whiskeysockets/baileys";
import { formatBytes, inspectMedia, prepareStatusPayload } from "./status-media.js";
import { log } from "./logger.js";
import { ackTimeoutFromEnv, watchServerAcks } from "./server-ack.js";

export async function publishStatus(socket, {
  uploadPath,
  caption,
  statusRecipients,
  ackTimeoutMs = ackTimeoutFromEnv()
}) {
  const media = await inspectMedia(uploadPath);
  const senderJid = jidNormalizedUser(socket.user?.id);

  if (!senderJid) {
    throw new Error("Invalid sender account JID; upload cancelled.");
  }

  const normalizedRecipients = statusRecipients
    .map((jid) => jidNormalizedUser(jid))
    .filter(Boolean);

  const fanoutRecipients = [...new Set([senderJid, ...normalizedRecipients])];
  const { content, dimensions } = await prepareStatusPayload(media, caption);

  log.info(`File       : ${media.filename}`);
  log.info(`Size       : ${formatBytes(media.size)}`);
  if (dimensions) log.info(`Resolution : ${dimensions}`);
  log.info(`Audience   : ${normalizedRecipients.length} recipients + sender account`);
  log.info("Quality    : original source file preserved; no CLI re-encoding");
  log.info("Uploading Status…");

  const acks = watchServerAcks(socket);
  try {
    const result = await socket.sendMessage("status@broadcast", content, {
      broadcast: true,
      statusJidList: fanoutRecipients,
      mediaUploadTimeoutMs: 180000
    });

    const messageId = result?.key?.id;
    if (messageId) {
      log.success("Upload request accepted by Baileys.");
      log.info(`Message ID : ${messageId}`);
    } else {
      log.warn("Baileys did not return a Message ID.");
    }

    if (messageId && acks) {
      log.info(`Waiting for WhatsApp server confirmation (up to ${Math.round(ackTimeoutMs / 1000)}s)…`);
      const ack = await acks.wait(messageId, ackTimeoutMs);
      if (!ack) {
        throw new Error(`No WhatsApp server confirmation within ${Math.round(ackTimeoutMs / 1000)}s. The Status may not be published; check My Status before retrying.`);
      }
      if (ack.error) {
        throw new Error(`WhatsApp server rejected the Status (error ${ack.error}).`);
      }
      log.success(`WhatsApp server confirmed the Status${ack.count ? ` (count ${ack.count})` : ""}.`);
    } else if (messageId) {
      log.warn("Server confirmation is unavailable for this connection.");
    }
    log.info("Check My Status and recipient visibility to confirm publication.");
    return result;
  } finally {
    acks?.close();
  }
}
