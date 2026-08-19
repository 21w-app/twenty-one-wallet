import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const loadDotEnv = (envPath) => {
  if (!existsSync(envPath)) {
    return;
  }

  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.startsWith("#")) {
      continue;
    }

    const separator = trimmed.indexOf("=");
    if (separator <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    if (key.length === 0 || process.env[key] != null) {
      continue;
    }

    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
};

loadDotEnv(resolve(root, ".env"));

const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL?.trim();
if (backendUrl == null || backendUrl.length === 0) {
  console.error(
    "EXPO_PUBLIC_BACKEND_URL must be set in apps/mobile/.env (or the environment) before OTA publish.",
  );
  process.exit(1);
}

const channel = process.argv[2];
if (channel !== "preview" && channel !== "production") {
  console.error(
    "Usage: node scripts/easUpdate.mjs <preview|production> [-- eas update args]",
  );
  process.exit(1);
}

const extraArgs = process.argv.slice(3);
const result = spawnSync(
  "eas",
  ["update", "--channel", channel, ...extraArgs],
  {
    cwd: root,
    env: process.env,
    stdio: "inherit",
    shell: process.platform === "win32",
  },
);

process.exit(result.status ?? 1);
