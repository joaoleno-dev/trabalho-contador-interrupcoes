/**
 * Background entry point.
 *
 * This file runs as a service worker on Chromium and as a non-persistent
 * event page on Firefox (see scripts/build.mjs for how each manifest is
 * generated). Both environments can be terminated by the browser at any
 * time, so NOTHING here may rely on in-memory state between events —
 * from Phase 2 onwards, all state lives in `browser.storage.local`.
 *
 * Architectural rule of this project: the background is the single source
 * of truth. The popup is a pure view and asks for every state change via
 * `runtime.sendMessage`. The popup can be closed at any moment (a single
 * click outside closes it), so it must never own state.
 */

import browser from "webextension-polyfill";

/**
 * Messages the popup can send to the background.
 * Phase 1 only defines `ping`, used to validate that the messaging channel
 * works on both browsers. Phase 2 will add `startInterruption`,
 * `endInterruption` and `getState`.
 */
interface PingMessage {
  type: "ping";
}

interface PongResponse {
  type: "pong";
  /** Identifies which context answered — useful when debugging. */
  respondedBy: "background";
  /** Timestamp of the response, epoch milliseconds. */
  at: number;
}

browser.runtime.onInstalled.addListener((details) => {
  // Logged to the background console (chrome://extensions "service worker"
  // link on Chromium, about:debugging on Firefox).
  console.log(`[interruption-counter] installed (reason: ${details.reason})`);
});

browser.runtime.onMessage.addListener((message: unknown): Promise<PongResponse> | undefined => {
  // Messages are untyped at the boundary; narrow them defensively so a
  // malformed message can never crash the background context.
  if (typeof message === "object" && message !== null && (message as PingMessage).type === "ping") {
    // Returning a Promise from the listener sends its resolved value back
    // to the caller (webextension-polyfill semantics on both browsers).
    return Promise.resolve({
      type: "pong",
      respondedBy: "background",
      at: Date.now(),
    });
  }

  // Not a message we understand: return undefined so other listeners
  // (if any) get a chance to respond.
  return undefined;
});
