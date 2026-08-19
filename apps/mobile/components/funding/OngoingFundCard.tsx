import { StyleSheet, View } from "react-native";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Text } from "@/components/Text";
import { useI18n } from "@/hooks/useI18n";
import { formatSats } from "@/lib/formatSats";
import type { BoardingFundState } from "@/lib/getBoardingFundState";
import { spacing } from "@/lib/theme";

type OngoingFundCardProps = {
  fundState: BoardingFundState;
  isLoading: boolean;
  isOnboarding: boolean;
  onOnboard: () => void;
};

export const OngoingFundCard = ({
  fundState,
  isLoading,
  isOnboarding,
  onOnboard,
}: OngoingFundCardProps) => {
  const { t } = useI18n();
  const hasUnconfirmed = fundState.unconfirmedSats > 0;
  const canOnboard = fundState.canOnboard;

  if (!hasUnconfirmed && !canOnboard) {
    return null;
  }

  return (
    <Card style={styles.card}>
      <Text variant="title">{t("funding.onchainOngoingFund")}</Text>

      {hasUnconfirmed ? (
        <View style={styles.section}>
          <Text variant="label">{t("funding.onchainPendingDeposit")}</Text>
          <Text variant="body">
            {t("activity.amountSats", {
              sign: "",
              amount: formatSats(fundState.unconfirmedSats),
            })}
          </Text>
          <Text muted variant="caption">
            {t("funding.onchainPendingDepositHint")}
          </Text>
        </View>
      ) : null}

      {canOnboard ? (
        <View style={styles.section}>
          <Text variant="label">{t("funding.onchainReadyToSettle")}</Text>
          <Text variant="body">
            {t("activity.amountSats", {
              sign: "",
              amount: formatSats(fundState.confirmedSats),
            })}
          </Text>
          <Button
            disabled={isOnboarding || isLoading}
            label={
              isOnboarding
                ? t("funding.onchainSettling")
                : t("funding.onchainSettleToWallet")
            }
            onPress={onOnboard}
            style={styles.action}
          />
        </View>
      ) : null}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
  },
  section: {
    gap: spacing.xs,
  },
  action: {
    marginTop: spacing.sm,
  },
});
