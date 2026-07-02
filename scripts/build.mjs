/**
 * Cross-browser build script.
 *
 * Produces two ready-to-load extension folders from a single source tree:
 *
 *   dist/chrome/   -> Chrome, Edge, Brave, Opera... (Chromium-based)
 *   dist/firefox/  -> Firefox and forks (Gecko-based)
 *
 * Why two outputs? Manifest V3 background scripts differ between engines:
 *   - Chromium requires `background.service_worker`.
 *   - Firefox does not support service workers for extensions; it uses
 *     (non-persistent) event pages declared via `background.scripts`,
 *     and additionally needs a `browser_specific_settings.gecko` block.
 *
 * Everything else (popup, permissions, TypeScript sources) is shared, so we
 * keep a single `src/manifest.base.json` and patch the per-engine keys here.
 */

import { build } from "esbuild";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Resolve paths relative to the repository root, so the script works no
// matter which directory it is invoked from.
const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = resolve(rootDir, "src");
const distDir = resolve(rootDir, "dist");

const baseManifest = JSON.parse(
  readFileSync(resolve(srcDir, "manifest.base.json"), "utf8"),
);

/** Browser targets and the manifest keys that differ between them. */
const targets = {
  chrome: {
    // Chromium: the background context is a service worker.
    background: { service_worker: "background/index.js" },
  },
  firefox: {
    // Firefox: the background context is a non-persistent event page.
    background: { scripts: ["background/index.js"] },
    // Required by Firefox for MV3 extensions: a stable add-on id and the
    // minimum version that supports MV3 (109 was the first stable release).
    browser_specific_settings: {
      gecko: {
        id: "interruption-counter@joaoleno.dev",
        strict_min_version: "109.0",
      },
    },
  },
};

for (const [target, manifestOverrides] of Object.entries(targets)) {
  const outDir = resolve(distDir, target);

  // Start from a clean slate so removed files don't linger between builds.
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  // Bundle each entry point with its imports (e.g. webextension-polyfill)
  // into a single self-contained IIFE file. IIFE (not ESM) because Firefox
  // background scripts are classic scripts, and it works everywhere.
  await build({
    entryPoints: {
      "background/index": resolve(srcDir, "background/index.ts"),
      "popup/popup": resolve(srcDir, "popup/popup.ts"),
    },
    outdir: outDir,
    bundle: true,
    format: "iife",
    target: "es2022",
    // Keep the output readable: this is an open-source educational project
    // and reviewers (including store reviewers) should be able to read it.
    minify: false,
    sourcemap: false,
  });

  // Static popup assets are copied as-is.
  cpSync(resolve(srcDir, "popup/popup.html"), resolve(outDir, "popup/popup.html"));
  cpSync(resolve(srcDir, "popup/popup.css"), resolve(outDir, "popup/popup.css"));

  // Merge the shared manifest with the per-engine overrides.
  const manifest = { ...structuredClone(baseManifest), ...manifestOverrides };
  writeFileSync(
    resolve(outDir, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
  );

  console.log(`Built ${target} -> dist/${target}`);
}
