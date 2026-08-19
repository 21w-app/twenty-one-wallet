import { StyleSheet, View } from "react-native";

import { Text } from "@/components/Text";
import { useFiatEquivalent } from "@/hooks/useFiatEquivalent";
import { useI18n } from "@/hooks/useI18n";
import { formatSats } from "@/lib/formatSats";
import {
  APP_BALANCE_HORIZONTAL_PADDING,
  APP_CONTENT_SECTION_GAP,
  APP_HEADER_MARGIN_BOTTOM,
} from "@/lib/screenHeaderLayout";
import { spacing } from "@/lib/theme";

type BalanceBlockProps = {
  balanceSats: number | null;
  syncError?: string | null;
};

export const BalanceBlock = ({ balanceSats, syncError }: BalanceBlockProps) => {
  const { t } = useI18n();
  const fiatLabel = useFiatEquivalent(balanceSats);
  const balanceLabel =
    balanceSats == null
      ? "—"
      : t("home.balanceSats", { amount: formatSats(balanceSats) });

  return (
    <View style={styles.container}>
      <Text muted variant="caption">
        {t("home.totalBalance")}
      </Text>
      <Text style={styles.balance} variant="titleLarge">
        {balanceLabel}
      </Text>
      {fiatLabel != null ? (
        <Text muted variant="caption">
          {t("home.fiatApprox", { fiat: fiatLabel })}
        </Text>
      ) : null}
      {syncError != null ? (
        <Text muted style={styles.syncError} variant="caption">
          {syncError}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginBottom: APP_HEADER_MARGIN_BOTTOM,
    marginTop: APP_CONTENT_SECTION_GAP,
    paddingHorizontal: APP_BALANCE_HORIZONTAL_PADDING,
  },
  balance: {
    marginVertical: spacing.xs,
  },
  syncError: {
    marginTop: spacing.sm,
    textAlign: "center",
  },
});
