import { Redirect, useRouter } from "expo-router";
import {
  allowScreenCaptureAsync,
  preventScreenCaptureAsync,
} from "expo-screen-capture";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { Button } from "@/components/Button";
import { MnemonicGrid } from "@/components/MnemonicGrid";
import { Screen } from "@/components/Screen";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Text } from "@/components/Text";
import { WalletGateLoading } from "@/components/WalletGateLoading";
import { useI18n } from "@/hooks/useI18n";
import { useTheme } from "@/hooks/useTheme";
import { useWalletGate } from "@/hooks/useWalletGate";
import { loadMnemonic } from "@/lib/loadMnemonic";
import { spacing } from "@/lib/theme";

const REVEAL_CAPTURE_TAG = "reveal-recovery-phrase";

const RecoveryPhraseScreen = () => {
  const router = useRouter();
  const { t } = useI18n();
  const { colors } = useTheme();
  const { isLoading, walletPresent } = useWalletGate();
  const [revealedPhrase, setRevealedPhrase] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(true);

  useEffect(() => {
    if (isLoading || !walletPresent) {
      return;
    }

    let isMounted = true;

    const revealPhrase = async () => {
      setError(null);
      setIsAuthenticating(true);

      try {
        await preventScreenCaptureAsync(REVEAL_CAPTURE_TAG);
      } catch {
        if (!isMounted) {
          return;
        }

        setError(t("recoveryPhrase.protectError"));
        setIsAuthenticating(false);
        return;
      }

      const mnemonic = await loadMnemonic();

      if (!isMounted) {
        return;
      }

      if (mnemonic == null) {
        await allowScreenCaptureAsync(REVEAL_CAPTURE_TAG);
        setError(t("recoveryPhrase.loadError"));
        setIsAuthenticating(false);
        return;
      }

      setRevealedPhrase(mnemonic);
      setIsAuthenticating(false);
    };

    void revealPhrase();

    return () => {
      isMounted = false;
      void allowScreenCaptureAsync(REVEAL_CAPTURE_TAG);
    };
  }, [isLoading, t, walletPresent]);

  if (isLoading) {
    return <WalletGateLoading />;
  }

  if (!walletPresent) {
    return <Redirect href="/welcome" />;
  }

  return (
    <Screen header={<ScreenHeader title={t("recoveryPhrase.title")} />} scroll>
      <Text style={styles.description} variant="body">
        {t("recoveryPhrase.body")}
      </Text>

      {isAuthenticating ? (
        <View style={styles.section}>
          <Text muted variant="body">
            {t("recoveryPhrase.waitingForAuth")}
          </Text>
        </View>
      ) : null}

      {revealedPhrase != null ? (
        <View style={styles.section}>
          <MnemonicGrid words={revealedPhrase.split(/\s+/)} />
        </View>
      ) : null}

      {!isAuthenticating && revealedPhrase == null ? (
        <View style={styles.section}>
          <Button
            label={t("recoveryPhrase.backToSettings")}
            onPress={() => {
              router.back();
            }}
            variant="secondary"
          />
        </View>
      ) : null}

      {error != null ? (
        <Text style={{ color: colors.error }} variant="caption">
          {error}
        </Text>
      ) : null}
    </Screen>
  );
};

export default RecoveryPhraseScreen;

const styles = StyleSheet.create({
  description: {
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
});
