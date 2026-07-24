import * as SplashScreen from "expo-splash-screen";

void SplashScreen.preventAutoHideAsync().catch(() => {
  // Splash may already be controlled by the native layer on reload.
});
