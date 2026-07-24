import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { InteractionManager } from "react-native";

const MIN_SPLASH_MS = 800;

let splashHidden = false;

export const useAppSplashScreen = (isReady: boolean) => {
  useEffect(() => {
    if (!isReady || splashHidden) {
      return;
    }

    splashHidden = true;

    const hideSplash = async () => {
      const minDelay = new Promise<void>((resolve) => {
        setTimeout(resolve, MIN_SPLASH_MS);
      });
      const afterInteractions = new Promise<void>((resolve) => {
        InteractionManager.runAfterInteractions(() => {
          resolve();
        });
      });

      await Promise.all([minDelay, afterInteractions]);
      await SplashScreen.hideAsync();
    };

    void hideSplash();
  }, [isReady]);
};
