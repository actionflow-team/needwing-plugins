#!/usr/bin/env node
// Generate the Cursor MCP install deep link for the Needwing remote server.
//
// Format (https://cursor.com/docs/mcp/install-links):
//   cursor://anysphere.cursor-deeplink/mcp/install?name=$NAME&config=$BASE64_ENCODED_CONFIG
// where $BASE64_ENCODED_CONFIG = base64(JSON.stringify(config)).
//
// Usage:
//   node scripts/make-cursor-deeplink.mjs            # print the link
//   node scripts/make-cursor-deeplink.mjs --verify '<link>'   # decode and check a link

import { Buffer } from "node:buffer";

export const SERVER_NAME = "needwing";
// The address plugins install: the trial endpoint works for everyone — the
// browser approval creates a trial account automatically, and a person
// already signed in at needwing.ai approves their own account.
export const MCP_URL = "https://needwing.ai/mcp/trial";

/** The JSON configuration payload handed to Cursor. */
export function cursorConfig() {
  return { type: "http", url: MCP_URL };
}

export function encodeCursorLink(name = SERVER_NAME, config = cursorConfig()) {
  const b64 = Buffer.from(JSON.stringify(config), "utf8").toString("base64");
  return `cursor://anysphere.cursor-deeplink/mcp/install?name=${encodeURIComponent(name)}&config=${encodeURIComponent(b64)}`;
}

export function decodeCursorLink(link) {
  const match = /^cursor:\/\/anysphere\.cursor-deeplink\/mcp\/install\?name=([^&]+)&config=([^&]+)$/.exec(link);
  if (!match) return null;
  const name = decodeURIComponent(match[1]);
  const config = JSON.parse(Buffer.from(decodeURIComponent(match[2]), "base64").toString("utf8"));
  return { name, config };
}

const link = encodeCursorLink();

if (process.argv[2] === "--verify") {
  const candidate = process.argv[3] ?? "";
  const decoded = decodeCursorLink(candidate);
  if (!decoded) {
    console.error("NOT A VALID NEEDWING CURSOR DEEPLINK");
    process.exit(1);
  }
  const expected = JSON.stringify(cursorConfig());
  if (decoded.name !== SERVER_NAME || JSON.stringify(decoded.config) !== expected) {
    console.error(`MISMATCH: name=${decoded.name} config=${JSON.stringify(decoded.config)}`);
    process.exit(1);
  }
  console.log(`OK name=${decoded.name} config=${JSON.stringify(decoded.config)}`);
} else {
  console.log(link);
}
