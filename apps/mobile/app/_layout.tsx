import "@/lib/configureBoltzSwapLogging";
import "@/lib/ensureCryptoPolyfill";
import "@/lib/holdAppSplashScreen";

import { Stack } from "expo-router";
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from "react-native-safe-area-context";

import { AppAuthGate } from "@/components/AppAuthGate";
import { ForceUpdateScreen } from "@/components/ForceUpdateScreen";
import { IncomingFundsListener } from "@/components/IncomingFundsListener";
import { RemotePushNotificationListener } from "@/components/RemotePushNotificationListener";
import { ThemedStatusBar } from "@/components/ThemedStatusBar";
import { ActivityProvider } from "@/contexts/ActivityProvider";
import { ApiClientProvider } from "@/contexts/ApiClientProvider";
import { I18nProvider } from "@/contexts/I18nProvider";
import { QueryProvider } from "@/contexts/QueryProvider";
import { SwapsProvider } from "@/contexts/SwapsProvider";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { WalletProvider } from "@/contexts/WalletProvider";
import { useAppSplashScreen } from "@/hooks/useAppSplashScreen";
import { useAppVersionPolicy } from "@/hooks/useAppVersionPolicy";
import { useTheme } from "@/hooks/useTheme";
import { initializeRemotePushNotifications } from "@/lib/remotePushNotifications";

export const unstable_settings = {
  initialRouteName: "index",
};

initializeRemotePushNotifications();

const RootStack = () => {
  const { colors } = useTheme();

  return (
    <>
      <ThemedStatusBar />
      <IncomingFundsListener />
      <RemotePushNotificationListener />
      <AppAuthGate>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="welcome" />
          <Stack.Screen name="create-wallet" />
          <Stack.Screen name="ark-protocol" />
          <Stack.Screen name="restore-wallet" />
          <Stack.Screen name="recovery-phrase" />
          <Stack.Screen name="delete-wallet" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </AppAuthGate>
    </>
  );
};

const ForceUpdateLayout = ({
  storeUrl,
  updateMessage,
}: {
  storeUrl: string | null;
  updateMessage: string | null;
}) => {
  useAppSplashScreen(true);

  return (
    <ThemeProvider>
      <ForceUpdateScreen storeUrl={storeUrl} updateMessage={updateMessage} />
    </ThemeProvider>
  );
};

const RootLayout = () => {
  const { isLoading, isBlocked, updateMessage, storeUrl } =
    useAppVersionPolicy();

  if (isLoading) {
    return null;
  }

  if (isBlocked) {
    return (
      <ForceUpdateLayout storeUrl={storeUrl} updateMessage={updateMessage} />
    );
  }

  return (
    <ThemeProvider>
      <WalletProvider>
        <SwapsProvider>
          <ActivityProvider>
            <RootStack />
          </ActivityProvider>
        </SwapsProvider>
      </WalletProvider>
    </ThemeProvider>
  );
};

const App = () => {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <I18nProvider>
        <QueryProvider>
          <ApiClientProvider>
            <RootLayout />
          </ApiClientProvider>
        </QueryProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
};

export default App;
