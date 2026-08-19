import { useRouter } from "expo-router";
import {
  allowScreenCaptureAsync,
  preventScreenCaptureAsync,
} from "expo-screen-capture";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Button } from "@/components/Button";
import { MnemonicGrid } from "@/components/MnemonicGrid";
import { Screen } from "@/components/Screen";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Text } from "@/components/Text";
import { useI18n } from "@/hooks/useI18n";
import { useWallet } from "@/hooks/useWallet";
import { generateWalletMnemonic } from "@/lib/generateWalletMnemonic";
import { rollbackWalletSeed } from "@/lib/rollbackWalletSeed";
import { colors, radii, spacing } from "@/lib/theme";
import { writeWalletConfiguredFlag } from "@/lib/writeWalletConfiguredFlag";
import { writeWalletSeed } from "@/lib/writeWalletSeed";

type CreateStep = "ark" | "intro" | "phrase" | "confirm";

const CREATE_CAPTURE_TAG = "create-wallet-phrase";

const CreateWalletScreen = () => {
  const router = useRouter();
  const { t } = useI18n();
  const { reloadWallet, releaseWallet } = useWallet();
  const [step, setStep] = useState<CreateStep>("ark");
  const [words, setWords] = useState<string[]>([]);
  const [backedUp, setBackedUp] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mnemonicRef = useRef("");

  const clearMnemonic = () => {
    mnemonicRef.current = "";
    setWords((current) => {
      current.fill("");
      return [];
    });
  };

  useEffect(() => {
    return () => {
      clearMnemonic();
      void allowScreenCaptureAsync(CREATE_CAPTURE_TAG);
    };
  }, []);

  const protectPhraseScreen = async () => {
    try {
      await preventScreenCaptureAsync(CREATE_CAPTURE_TAG);
    } catch {
      // Ignore — capture blocking is defense-in-depth, not a gate.
    }
  };

  const releasePhraseScreen = async () => {
    await allowScreenCaptureAsync(CREATE_CAPTURE_TAG);
  };

  const handleGenerate = async () => {
    setError(null);
    setIsWorking(true);

    try {
      const mnemonic = generateWalletMnemonic();
      mnemonicRef.current = mnemonic;
      setWords(mnemonic.split(" "));
      await protectPhraseScreen();
      setStep("phrase");
    } catch {
      clearMnemonic();
      setError(t("createWallet.startError"));
    } finally {
      setIsWorking(false);
    }
  };

  const handleBackFromArk = () => {
    router.back();
  };

  const handleBackFromIntro = () => {
    clearMnemonic();
    setError(null);
    setStep("ark");
  };

  const handleBackFromPhrase = async () => {
    clearMnemonic();
    await releasePhraseScreen();
    setStep("intro");
  };

  const handleBackFromConfirm = async () => {
    setBackedUp(false);
    setError(null);

    const mnemonic = mnemonicRef.current;

    if (mnemonic.length === 0) {
      await handleBackFromPhrase();
      return;
    }

    setWords(mnemonic.split(" "));
    await protectPhraseScreen();
    setStep("phrase");
  };

  const handlePhraseWritten = () => {
    setWords((current) => {
      current.fill("");
      return [];
    });
    void releasePhraseScreen();
    setStep("confirm");
  };

  const handleConfirm = async () => {
    const mnemonic = mnemonicRef.current;

    if (mnemonic.length === 0) {
      setError(t("createWallet.startError"));
      return;
    }

    setError(null);
    setIsWorking(true);

    try {
      await writeWalletSeed(mnemonic);
      const loaded = await reloadWallet();

      if (!loaded) {
        await rollbackWalletSeed();
        setError(t("createWallet.unlockError"));
        setIsWorking(false);
        return;
      }

      try {
        await writeWalletConfiguredFlag();
      } catch {
        await releaseWallet();
        await rollbackWalletSeed();
        setError(t("createWallet.finishError"));
        setIsWorking(false);
        return;
      }

      clearMnemonic();
      router.replace("/(tabs)");
    } catch {
      await rollbackWalletSeed();
      setError(t("createWallet.finishError"));
      setIsWorking(false);
    }
  };

  if (step === "phrase") {
    return (
      <Screen
        header={
          <ScreenHeader
            onBackPress={() => {
              void handleBackFromPhrase();
            }}
            title={t("createWallet.recoveryPhraseTitle")}
          />
        }
        scroll
      >
        <Text style={styles.intro} variant="body">
          {t("createWallet.recoveryPhraseBody")}
        </Text>

        <MnemonicGrid words={words} />

        <Button
          label={t("createWallet.wroteItDown")}
          onPress={handlePhraseWritten}
        />
      </Screen>
    );
  }

  if (step === "confirm") {
    return (
      <Screen
        header={
          <ScreenHeader
            onBackPress={() => {
              void handleBackFromConfirm();
            }}
            title={t("createWallet.confirmBackupTitle")}
          />
        }
        scroll
      >
        <Text style={styles.intro} variant="body">
          {t("createWallet.confirmBackupBody")}
        </Text>

        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: backedUp }}
          onPress={() => {
            setBackedUp((current) => {
              return !current;
            });
          }}
          style={styles.checkboxRow}
        >
          <View style={[styles.checkbox, backedUp && styles.checkboxChecked]}>
            {backedUp ? (
              <Text style={styles.checkmark} variant="label">
                ✓
              </Text>
            ) : null}
          </View>
          <Text style={styles.checkboxLabel} variant="body">
            {t("createWallet.backedUp")}
          </Text>
        </Pressable>

        {error != null ? (
          <Text style={styles.error} variant="caption">
            {error}
          </Text>
        ) : null}

        <Button
          disabled={!backedUp || isWorking}
          label={isWorking ? t("common.saving") : t("common.createWallet")}
          onPress={() => {
            void handleConfirm();
          }}
          style={styles.submit}
        />
      </Screen>
    );
  }

  if (step === "intro") {
    return (
      <Screen
        header={
          <ScreenHeader
            onBackPress={handleBackFromIntro}
            title={t("createWallet.title")}
          />
        }
        scroll
      >
        <Text style={styles.intro} variant="body">
          {t("createWallet.recoveryIntro")}
        </Text>

        {error != null ? (
          <Text style={styles.error} variant="caption">
            {error}
          </Text>
        ) : null}

        <Button
          disabled={isWorking}
          label={isWorking ? t("common.preparing") : t("common.continue")}
          onPress={() => {
            void handleGenerate();
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen
      header={
        <ScreenHeader
          onBackPress={handleBackFromArk}
          title={t("createWallet.arkIntroTitle")}
        />
      }
      scroll
    >
      <Text style={styles.intro} variant="body">
        {t("createWallet.arkIntroBody")}
      </Text>

      <View style={styles.actions}>
        <Button
          label={t("createWallet.learnAboutArk")}
          onPress={() => {
            router.push("/ark-protocol");
          }}
          variant="secondary"
        />
        <Button
          label={t("common.continue")}
          onPress={() => {
            setStep("intro");
          }}
        />
      </View>
    </Screen>
  );
};

export default CreateWalletScreen;

const styles = StyleSheet.create({
  intro: {
    marginBottom: spacing.lg,
  },
  actions: {
    gap: spacing.md,
  },
  checkboxRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  checkbox: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: radii.sm,
    borderWidth: 1,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  checkboxChecked: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  checkmark: {
    color: colors.background,
  },
  checkboxLabel: {
    flex: 1,
  },
  error: {
    color: colors.error,
    marginBottom: spacing.md,
  },
  submit: {
    marginTop: spacing.md,
  },
});
