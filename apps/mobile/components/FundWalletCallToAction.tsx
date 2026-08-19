import { useRouter } from "expo-router";
import { StyleSheet } from "react-native";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Text } from "@/components/Text";
import { useI18n } from "@/hooks/useI18n";
import { spacing } from "@/lib/theme";

export const FundWalletCallToAction = () => {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <Card style={styles.card}>
      <Text variant="title">{t("home.fundTitle")}</Text>
      <Text muted variant="body">
        {t("home.fundBody")}
      </Text>
      <Button
        label={t("home.fundCta")}
        onPress={() => {
          router.push("/funding");
        }}
        style={styles.button}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.sm,
  },
  button: {
    marginTop: spacing.sm,
  },
});
