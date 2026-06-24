#!/usr/bin/env node
/**
 * One-time bootstrap: deploy key on strikerdlm/selectron + secret on selectron_private.
 * Requires `gh` authenticated with admin on both repositories.
 *
 * Usage: node scripts/bootstrap-public-sync-auth.mjs
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const KEY_DIR = join(__dirname, "..", "exports", "sync-deploy-key");
const KEY_PATH = join(KEY_DIR, "selectron_public_sync");
const PUBLIC_REPO = "strikerdlm/selectron";
const PRIVATE_REPO = "strikerdlm/selectron_private";
const KEY_TITLE = "selectron_private-actions-sync";
const SECRET_NAME = "SELECTRON_PUBLIC_DEPLOY_KEY";

function run(cmd, args, input) {
  return execFileSync(cmd, args, {
    encoding: "utf8",
    input,
    stdio: input ? ["pipe", "pipe", "pipe"] : ["inherit", "pipe", "pipe"],
  }).trim();
}

function ghJson(args) {
  const out = run("gh", ["api", ...args]);
  return out ? JSON.parse(out) : null;
}

function ensureKeyPair() {
  mkdirSync(KEY_DIR, { recursive: true });
  if (!existsSync(KEY_PATH)) {
    run("ssh-keygen", [
      "-t",
      "ed25519",
      "-f",
      KEY_PATH,
      "-N",
      "",
      "-C",
      KEY_TITLE,
    ]);
    console.log(`Generated deploy key at ${KEY_PATH}`);
  } else {
    console.log(`Reusing existing key at ${KEY_PATH}`);
  }
  return {
    privateKey: readFileSync(KEY_PATH, "utf8"),
    publicKey: readFileSync(`${KEY_PATH}.pub`, "utf8"),
  };
}

function deployKeyPresent(publicKey) {
  const keys = ghJson([`repos/${PUBLIC_REPO}/keys`]);
  return keys.some(
    (k) => k.title === KEY_TITLE || k.key.trim() === publicKey.trim(),
  );
}

function addDeployKey(publicKey) {
  if (deployKeyPresent(publicKey)) {
    console.log(`Deploy key "${KEY_TITLE}" already on ${PUBLIC_REPO}`);
    return;
  }
  ghJson([
    `repos/${PUBLIC_REPO}/keys`,
    "-f",
    `title=${KEY_TITLE}`,
    "-f",
    `key=${publicKey.trim()}`,
    "-F",
    "read_only=false",
  ]);
  console.log(`Added write deploy key to ${PUBLIC_REPO}`);
}

function setPrivateSecret(privateKey) {
  run("gh", ["secret", "set", SECRET_NAME, "--repo", PRIVATE_REPO], privateKey);
  console.log(`Set ${SECRET_NAME} on ${PRIVATE_REPO}`);
}

function writeGitignoreNote() {
  const notePath = join(KEY_DIR, ".gitignore");
  writeFileSync(notePath, "*\n!.gitignore\n", "utf8");
}

function main() {
  try {
    run("gh", ["auth", "status"]);
  } catch {
    throw new Error("gh is not authenticated. Run: gh auth login");
  }

  const { privateKey, publicKey } = ensureKeyPair();
  addDeployKey(publicKey);
  setPrivateSecret(privateKey);
  writeGitignoreNote();

  console.log("\nBootstrap complete. Release-tag pushes on selectron_private will sync public master automatically.");
}

main();
