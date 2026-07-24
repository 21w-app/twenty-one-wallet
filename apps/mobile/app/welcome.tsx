import { Redirect, useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import { Button } from "@/components/Button";
import { LogoMark } from "@/components/LogoMark";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { WalletGateLoading } from "@/components/WalletGateLoading";
import { useI18n } from "@/hooks/useI18n";
import { useWalletGate } from "@/hooks/useWalletGate";
import { spacing } from "@/lib/theme";

const WelcomeScreen = () => {
  const router = useRouter();
  const { t } = useI18n();
  const { isLoading, walletPresent } = useWalletGate();

  if (isLoading) {
    return <WalletGateLoading />;
  }

  if (walletPresent) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Screen style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.branding}>
          <View style={styles.logoWrap}>
            <LogoMark />
          </View>
          <Text variant="body">{t("welcome.productName")}</Text>
          <Text muted style={styles.tagline} variant="caption">
            {t("welcome.tagline")}
          </Text>
        </View>

        <View style={styles.actions}>
          <Button
            label={t("common.createWallet")}
            onPress={() => {
              router.push("/create-wallet");
            }}
          />
          <Button
            label={t("common.restoreWallet")}
            onPress={() => {
              router.push("/restore-wallet");
            }}
            variant="secondary"
          />
        </View>
      </View>
    </Screen>
  );
};

export default WelcomeScreen;

const styles = StyleSheet.create({
  screen: {
    justifyContent: "center",
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingBottom: spacing.xl,
    paddingTop: spacing.xxl,
  },
  branding: {
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  logoWrap: {
    marginBottom: spacing.sm,
  },
  tagline: {
    marginTop: spacing.sm,
    textAlign: "center",
  },
  actions: {
    gap: spacing.md,
  },
});
