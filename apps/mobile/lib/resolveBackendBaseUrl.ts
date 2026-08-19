const DEV_BACKEND_URL = "http://localhost:3000";

const normalizeBaseUrl = (value: string): string => {
  return value.replace(/\/$/, "");
};

export const resolveBackendBaseUrl = ({
  envUrl,
  extraUrl,
  isDev,
}: {
  envUrl?: string | null;
  extraUrl?: string | null;
  isDev: boolean;
}): string => {
  const fromEnv = envUrl?.trim();
  const fromExtra = typeof extraUrl === "string" ? extraUrl.trim() : null;
  const configured = fromEnv ?? fromExtra;

  if (configured != null && configured.length > 0) {
    return normalizeBaseUrl(configured);
  }

  if (isDev) {
    return DEV_BACKEND_URL;
  }

  throw new Error(
    "[backend-config] EXPO_PUBLIC_BACKEND_URL is required for release builds. Set it in apps/mobile/.env and in EAS project environment variables.",
  );
};
