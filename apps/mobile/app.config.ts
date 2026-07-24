import { existsSync } from "node:fs";

import { ExpoConfig, ConfigContext } from "expo/config";

const brandingPath = "./assets/branding/approved";

const readNonEmptyEnv = (name: string): string | undefined => {
  const value = process.env[name]?.trim();
  return value != null && value.length > 0 ? value : undefined;
};

const resolveEasProjectId = (): string => {
  const fromEnv =
    readNonEmptyEnv("EAS_PROJECT_ID") ??
    readNonEmptyEnv("EXPO_PUBLIC_EAS_PROJECT_ID");

  if (fromEnv != null) {
    return fromEnv;
  }

  throw new Error(
    "Missing EAS_PROJECT_ID. Copy apps/mobile/.env.example to apps/mobile/.env (local) or set EAS_PROJECT_ID in Expo project env / EAS secrets (CI).",
  );
};

const resolveGoogleServicesFile = (): string | undefined => {
  const fromEnv = readNonEmptyEnv("GOOGLE_SERVICES_JSON");

  if (fromEnv != null) {
    return fromEnv;
  }

  const localPath = "./google-services.json";

  if (existsSync(localPath)) {
    return localPath;
  }

  return undefined;
};

const appConfig = ({ config }: ConfigContext): ExpoConfig => {
  const easProjectId = resolveEasProjectId();
  const googleServicesFile = resolveGoogleServicesFile();

  return {
    ...config,
    name: "21W",
    slug: "21w",
    version: "1.0.4",
    orientation: "portrait",
    icon: `${brandingPath}/app-icon.png`,
    scheme: "twentyonewallet",
    userInterfaceStyle: "dark",
    runtimeVersion: {
      policy: "appVersion",
    },
    updates: {
      url: `https://u.expo.dev/${easProjectId}`,
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: "app.twentyonewallet.wallet",
      infoPlist: {
        NSFaceIDUsageDescription:
          "21W uses Face ID when you choose biometric app unlock.",
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      package: "app.twentyonewallet.wallet",
      ...(googleServicesFile != null ? { googleServicesFile } : {}),
      softwareKeyboardLayoutMode: "resize",
      adaptiveIcon: {
        foregroundImage: `${brandingPath}/android-adaptive-icon-foreground.png`,
        backgroundColor: "#000000",
      },
      predictiveBackGestureEnabled: false,
    },
    plugins: [
      "expo-router",
      "expo-localization",
      [
        "expo-secure-store",
        {
          faceIDPermission:
            "21W uses Face ID when you choose biometric app unlock.",
        },
      ],
      [
        "expo-local-authentication",
        {
          faceIDPermission:
            "21W uses Face ID when you choose biometric app unlock.",
        },
      ],
      "expo-sqlite",
      [
        "expo-camera",
        {
          cameraPermission: "21W uses the camera to scan payment invoices.",
        },
      ],
      [
        "expo-splash-screen",
        {
          image: `${brandingPath}/logo-mark-extracted.png`,
          imageWidth: 220,
          resizeMode: "contain",
          backgroundColor: "#000000",
          android: {
            image: `${brandingPath}/android-splash-icon.png`,
            imageWidth: 288,
            resizeMode: "contain",
            backgroundColor: "#000000",
          },
        },
      ],
      [
        "expo-notifications",
        {
          color: "#000000",
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      eas: {
        projectId: easProjectId,
      },
      backendUrl: process.env.EXPO_PUBLIC_BACKEND_URL,
    },
  };
};

export default appConfig;
