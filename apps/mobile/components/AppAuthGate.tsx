import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { WalletGateLoading } from "@/components/WalletGateLoading";
import { useAppSplashScreen } from "@/hooks/useAppSplashScreen";
import { useAuthOnOpenGate } from "@/hooks/useAuthOnOpenGate";
import { useI18n } from "@/hooks/useI18n";
import { useTheme } from "@/hooks/useTheme";
import { useWalletGate } from "@/hooks/useWalletGate";
import { spacing } from "@/lib/theme";

type AppAuthGateProps = {
  children: ReactNode;
};

type AuthLockScreenProps = {
  error: string | null;
  onRetry: () => void;
};

const AuthLockScreen = ({ error, onRetry }: AuthLockScreenProps) => {
  const { t } = useI18n();

  return (
    <Screen>
      <View style={styles.block}>
        <Text variant="title">{t("auth.unlockTitle")}</Text>
        <Text variant="body">{t("auth.unlockBody")}</Text>
        {error != null ? (
          <Text style={styles.error} variant="caption">
            {error}
          </Text>
        ) : null}
        <Button label={t("common.tryAgain")} onPress={onRetry} />
      </View>
    </Screen>
  );
};

export const AppAuthGate = ({ children }: AppAuthGateProps) => {
  const { colors } = useTheme();
  const { isChecking, isUnlocked, isRequired, hasUnlockedOnce, error, retry } =
    useAuthOnOpenGate();
  const { isLoading: isWalletGateLoading } = useWalletGate();

  useAppSplashScreen(!isChecking && !isWalletGateLoading);

  if (isChecking && !hasUnlockedOnce) {
    return <WalletGateLoading />;
  }

  if (!isRequired) {
    return children;
  }

  const showNavigation = hasUnlockedOnce;
  const showLock = !isUnlocked;

  return (
    <View style={styles.container}>
      {showNavigation ? children : null}
      {showLock ? (
        <View
          style={[
            showNavigation ? styles.lockOverlay : styles.lockFullScreen,
            { backgroundColor: colors.background },
          ]}
        >
          <AuthLockScreen error={error} onRetry={retry} />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  block: {
    flex: 1,
    gap: spacing.md,
    justifyContent: "center",
  },
  container: {
    flex: 1,
  },
  error: {
    color: "#FF453A",
  },
  lockFullScreen: {
    flex: 1,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
});
