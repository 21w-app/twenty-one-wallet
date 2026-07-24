import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { Button } from "@/components/Button";
import { MnemonicInput } from "@/components/MnemonicInput";
import { Screen } from "@/components/Screen";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Text } from "@/components/Text";
import { useActivity } from "@/hooks/useActivity";
import { useI18n } from "@/hooks/useI18n";
import { useSwaps } from "@/hooks/useSwaps";
import { useWallet } from "@/hooks/useWallet";
import { clearWalletData } from "@/lib/clearWalletData";
import { deleteMnemonic } from "@/lib/deleteMnemonic";
import { saveMnemonic } from "@/lib/saveMnemonic";
import { colors, spacing } from "@/lib/theme";
import { validateWalletMnemonic } from "@/lib/validateWalletMnemonic";

const RestoreWalletScreen = () => {
  const router = useRouter();
  const { t } = useI18n();
  const { reloadWallet, releaseWallet, resetWallet } = useWallet();
  const { swaps, resetSwaps } = useSwaps();
  const { clearActivity } = useActivity();
  const [phrase, setPhrase] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleRestore = async () => {
    const validation = validateWalletMnemonic(phrase, t);

    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setIsRestoring(true);
    setError(null);

    try {
      await clearWalletData({
        swaps,
        releaseActiveWallet: async () => {
          resetSwaps();
          clearActivity();
          await releaseWallet();
        },
      });
      await saveMnemonic(validation.mnemonic);

      const loaded = await reloadWallet();

      if (!loaded) {
        await deleteMnemonic();
        resetWallet();
        setError(t("restoreWallet.unlockError"));
        setIsRestoring(false);
        return;
      }

      router.replace("/(tabs)");
    } catch {
      await deleteMnemonic();
      resetWallet();
      setError(t("restoreWallet.restoreError"));
      setIsRestoring(false);
    }
  };

  const handlePhraseChange = (text: string) => {
    setPhrase(text);

    if (error != null) {
      setError(null);
    }
  };

  return (
    <Screen
      header={
        <ScreenHeader showBack={false} title={t("restoreWallet.title")} />
      }
      scroll
    >
      <MnemonicInput
        editable={!isRestoring}
        onChangeText={handlePhraseChange}
        value={phrase}
      />

      {error != null ? (
        <Text style={styles.error} variant="caption">
          {error}
        </Text>
      ) : null}

      <View style={styles.actions}>
        <Button
          disabled={isRestoring}
          label={
            isRestoring ? t("common.restoring") : t("common.restoreWallet")
          }
          onPress={() => {
            void handleRestore();
          }}
        />
        <Button
          disabled={isRestoring}
          label={t("common.back")}
          onPress={() => {
            router.back();
          }}
          variant="secondary"
        />
      </View>
    </Screen>
  );
};

export default RestoreWalletScreen;

const styles = StyleSheet.create({
  error: {
    color: colors.error,
    marginTop: spacing.sm,
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
});
