import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import { BalanceBlock } from "@/components/BalanceBlock";
import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Text } from "@/components/Text";
import { WalletGateLoading } from "@/components/WalletGateLoading";
import { useI18n } from "@/hooks/useI18n";
import { useWallet } from "@/hooks/useWallet";
import { spacing } from "@/lib/theme";

const FundingScreen = () => {
  const router = useRouter();
  const { t } = useI18n();
  const { balanceSats, status, error } = useWallet();

  if (status === "loading" || status === "idle") {
    return <WalletGateLoading />;
  }

  return (
    <Screen header={<ScreenHeader title={t("funding.title")} />} scroll>
      <BalanceBlock balanceSats={balanceSats} syncError={error} />

      <View style={styles.actions}>
        <Button
          icon="receive"
          label={t("funding.fund")}
          onPress={() => {
            router.push("/funding/fund");
          }}
          style={styles.actionButton}
          variant="receive"
        />
        <Button
          icon="send"
          label={t("funding.withdraw")}
          onPress={() => {
            router.push("/funding/withdraw");
          }}
          style={styles.actionButton}
          variant="send"
        />
      </View>

      <Text muted style={styles.description} variant="body">
        {t("funding.hubBody")}
      </Text>
    </Screen>
  );
};

export default FundingScreen;

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  description: {
    marginTop: spacing.lg,
  },
});
