/**
 * Popup entry point.
 *
 * The popup is a PURE VIEW: it renders state and forwards user intent to
 * the background via `runtime.sendMessage`. It never mutates state itself,
 * because the browser can close it at any moment (any click outside the
 * popup dismisses it) and any in-flight local state would be lost.
 *
 * Phase 1 scope: prove the plumbing. On load, ping the background and show
 * whether it answered. If this works on Chrome and Firefox, every future
 * feature (start/end interruption, day detail) can rely on the same channel.
 */

import browser from "webextension-polyfill";

/** Shape of the background's answer to a `ping` (see background/index.ts). */
interface PongResponse {
  type: "pong";
  respondedBy: "background";
  at: number;
}

const statusEl = document.getElementById("status");

async function checkBackgroundConnection(): Promise<void> {
  if (!statusEl) return;

  try {
    const response = (await browser.runtime.sendMessage({ type: "ping" })) as
      | PongResponse
      | undefined;

    if (response?.type === "pong") {
      const time = new Date(response.at).toLocaleTimeString();
      statusEl.textContent = `Background connected ✓ (${time})`;
    } else {
      statusEl.textContent = "Background answered with an unexpected message.";
    }
  } catch (error) {
    // Most common cause on Chromium: the service worker failed to start.
    statusEl.textContent = "Could not reach the background script.";
    console.error("[interruption-counter] ping failed:", error);
  }
}

void checkBackgroundConnection();
