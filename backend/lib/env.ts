export type Env = {
  databaseUrl: string;
  port: number;
  nodeEnv: string;
  minSupportedAppVersion: string;
  minIosBuild: string | null;
  minAndroidBuild: string | null;
  iosStoreUrl: string | null;
  androidStoreUrl: string | null;
  updateMessage: string | null;
  arkIndexerUrl: string;
  expoAccessToken: string | null;
  vtxoExpiryPollIntervalMs: number;
  vtxoReminderCooldownMs: number;
  challengeTtlSeconds: number;
  workersEnabled: boolean;
  vtxoExpiryWorkerEnabled: boolean;
};

const readRequired = (key: string): string => {
  const value = process.env[key];

  if (value == null || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value.trim();
};

const readOptional = (key: string): string | null => {
  const value = process.env[key];

  if (value == null || value.trim().length === 0) {
    return null;
  }

  return value.trim();
};

const readPort = (): number => {
  const raw = process.env.PORT ?? "3000";
  const port = Number.parseInt(raw, 10);

  if (!Number.isFinite(port) || port <= 0) {
    throw new Error(`Invalid PORT: ${raw}`);
  }

  return port;
};

const readPositiveInt = (key: string, fallback: number): number => {
  const raw = process.env[key];

  if (raw == null || raw.trim().length === 0) {
    return fallback;
  }

  const value = Number.parseInt(raw, 10);

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Invalid ${key}: ${raw}`);
  }

  return value;
};

const readBoolean = (key: string, fallback: boolean): boolean => {
  const raw = process.env[key];

  if (raw == null || raw.trim().length === 0) {
    return fallback;
  }

  const normalized = raw.trim().toLowerCase();

  if (normalized === "true" || normalized === "1") {
    return true;
  }

  if (normalized === "false" || normalized === "0") {
    return false;
  }

  throw new Error(`Invalid ${key}: ${raw}`);
};

export const loadEnv = (): Env => {
  return {
    databaseUrl: readRequired("DATABASE_URL"),
    port: readPort(),
    nodeEnv: process.env.NODE_ENV ?? "development",
    minSupportedAppVersion:
      readOptional("MIN_SUPPORTED_APP_VERSION") ?? "1.0.0",
    minIosBuild: readOptional("MIN_IOS_BUILD"),
    minAndroidBuild: readOptional("MIN_ANDROID_BUILD"),
    iosStoreUrl: readOptional("IOS_STORE_URL"),
    androidStoreUrl: readOptional("ANDROID_STORE_URL"),
    updateMessage: readOptional("UPDATE_MESSAGE"),
    arkIndexerUrl: readOptional("ARK_INDEXER_URL") ?? "https://arkade.computer",
    expoAccessToken: readOptional("EXPO_ACCESS_TOKEN"),
    vtxoExpiryPollIntervalMs: readPositiveInt(
      "VTXO_EXPIRY_POLL_INTERVAL_MS",
      3_600_000,
    ),
    vtxoReminderCooldownMs: readPositiveInt(
      "VTXO_REMINDER_COOLDOWN_MS",
      86_400_000,
    ),
    challengeTtlSeconds: readPositiveInt("CHALLENGE_TTL_SECONDS", 300),
    workersEnabled: readBoolean("WORKERS_ENABLED", true),
    vtxoExpiryWorkerEnabled: readBoolean("VTXO_EXPIRY_WORKER_ENABLED", false),
  };
};
