import { Linking, StyleSheet, View } from "react-native";

import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { useI18n } from "@/hooks/useI18n";
import { spacing } from "@/lib/theme";

type ForceUpdateScreenProps = {
  updateMessage: string | null;
  storeUrl: string | null;
};

export const ForceUpdateScreen = ({
  updateMessage,
  storeUrl,
}: ForceUpdateScreenProps) => {
  const { t } = useI18n();

  const handleOpenStore = async () => {
    if (storeUrl == null) {
      return;
    }

    const canOpen = await Linking.canOpenURL(storeUrl);

    if (!canOpen) {
      return;
    }

    await Linking.openURL(storeUrl);
  };

  return (
    <Screen>
      <View style={styles.content}>
        <Text style={styles.title} variant="titleLarge">
          {t("forceUpdate.title")}
        </Text>
        <Text style={styles.body}>
          {updateMessage ?? t("forceUpdate.body")}
        </Text>
        {storeUrl != null ? (
          <Button
            label={t("forceUpdate.openStore")}
            onPress={() => {
              void handleOpenStore();
            }}
          />
        ) : null}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: "center",
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  title: {
    textAlign: "center",
  },
  body: {
    textAlign: "center",
  },
});
