import { Alert, Linking } from "react-native";

import type { TranslateFn } from "@/lib/createTranslator";

export const promptBiometricsSetup = (t: TranslateFn): void => {
  Alert.alert(
    t("settings.biometricsSetupAlertTitle"),
    t("settings.biometricsSetupAlertMessage"),
    [
      {
        text: t("common.cancel"),
        style: "cancel",
      },
      {
        text: t("settings.openDeviceSettings"),
        onPress: () => {
          void Linking.openSettings();
        },
      },
    ],
  );
};
