import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ActivityPreview } from "@/components/ActivityPreview";
import { BalanceBlock } from "@/components/BalanceBlock";
import { Button } from "@/components/Button";
import { FundWalletCallToAction } from "@/components/FundWalletCallToAction";
import { EnableNotificationsCallToAction } from "@/components/EnableNotificationsCallToAction";
import { FundingHeaderIcon } from "@/components/FundingHeaderIcon";
import { LogoHeader } from "@/components/LogoHeader";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { VtxoReminderCallToAction } from "@/components/VtxoReminderCallToAction";
import { WalletGateLoading } from "@/components/WalletGateLoading";
import { useActivity } from "@/hooks/useActivity";
import { useI18n } from "@/hooks/useI18n";
import { useTheme } from "@/hooks/useTheme";
import { useVtxoReminder } from "@/hooks/useVtxoReminder";
import { useWallet } from "@/hooks/useWallet";
import { useWalletPushEnabled } from "@/hooks/useWalletPushEnabled";
import { isExpoGo } from "@/lib/isExpoGo";
import {
  APP_HEADER_HEIGHT,
  APP_HEADER_MARGIN_BOTTOM,
  APP_HEADER_MARGIN_TOP,
  APP_HEADER_ACTION_BUTTON_SIZE,
} from "@/lib/screenHeaderLayout";
import { spacing } from "@/lib/theme";

const HomeScreen = () => {
  const router = useRouter();
  const { t } = useI18n();
  const { colors } = useTheme();
  const { balanceSats, status, error, reloadWallet, sync } = useWallet();
  const {
    items,
    isLoading: isActivityLoading,
    error: activityError,
    refresh,
  } = useActivity();
  const {
    isDue: isVtxoReminderDue,
    isLoading: isVtxoReminderLoading,
    dismissPermanently: dismissVtxoReminder,
    snooze: snoozeVtxoReminder,
  } = useVtxoReminder();
  const { isEnabled: isPushEnabled, refresh: refreshPushEnabled } =
    useWalletPushEnabled();
  const [refreshing, setRefreshing] = useState(false);
  const showFundCallToAction =
    status === "ready" &&
    balanceSats === 0 &&
    !isActivityLoading &&
    activityError == null &&
    items.length === 0;
  const showNotificationsCallToAction =
    showFundCallToAction && isPushEnabled === false && !isExpoGo();
  const emptyWalletSlotPending =
    status === "ready" &&
    balanceSats === 0 &&
    isActivityLoading &&
    activityError == null;
  const showVtxoReminderCallToAction =
    status === "ready" &&
    !isVtxoReminderLoading &&
    isVtxoReminderDue &&
    !showFundCallToAction &&
    !emptyWalletSlotPending;

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      await sync();
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh, sync]);

  if (status === "idle" || (status === "loading" && balanceSats == null)) {
    return (
      <Screen>
        <View style={styles.loading}>
          <WalletGateLoading />
        </View>
      </Screen>
    );
  }

  if (status === "error" && balanceSats == null) {
    return (
      <Screen>
        <View style={styles.loading}>
          <Text style={styles.unavailableText} variant="body">
            {error ?? t("home.walletUnlockFailed")}
          </Text>
          <Button
            label={t("common.tryAgain")}
            onPress={() => {
              void reloadWallet();
            }}
            style={styles.retryButton}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      header={
        <View style={styles.header}>
          <LogoHeader />
          <Pressable
            accessibilityLabel={t("home.openFunding")}
            accessibilityRole="button"
            hitSlop={12}
            onPress={() => {
              router.push("/funding");
            }}
            style={[
              styles.fundingButton,
              { backgroundColor: colors.surfaceElevated },
            ]}
          >
            <FundingHeaderIcon />
          </Pressable>
        </View>
      }
      onRefresh={handleRefresh}
      refreshing={refreshing}
      scroll
    >
      <BalanceBlock balanceSats={balanceSats} syncError={error} />

      <View style={styles.actions}>
        <Button
          icon="receive"
          label={t("home.receive")}
          onPress={() => {
            router.push("/receive");
          }}
          style={styles.actionButton}
          variant="receive"
        />
        <Button
          icon="send"
          label={t("home.send")}
          onPress={() => {
            router.push("/send");
          }}
          style={styles.actionButton}
          variant="send"
        />
      </View>

      {showFundCallToAction ? (
        <>
          <FundWalletCallToAction />
          {showNotificationsCallToAction ? (
            <EnableNotificationsCallToAction
              onEnabled={() => {
                void refreshPushEnabled();
              }}
            />
          ) : null}
        </>
      ) : showVtxoReminderCallToAction ? (
        <VtxoReminderCallToAction
          onDismissPermanently={dismissVtxoReminder}
          onSnooze={snoozeVtxoReminder}
        />
      ) : (
        <>
          <View style={styles.activityHeader}>
            <Text variant="title">{t("home.activity")}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                router.push("/activity");
              }}
            >
              <Text accent variant="label">
                {t("home.viewAll")}
              </Text>
            </Pressable>
          </View>

          <ActivityPreview />
        </>
      )}
    </Screen>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  loading: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    height: APP_HEADER_HEIGHT,
    justifyContent: "space-between",
    marginBottom: APP_HEADER_MARGIN_BOTTOM,
    marginTop: APP_HEADER_MARGIN_TOP,
  },
  fundingButton: {
    alignItems: "center",
    borderRadius: 18,
    height: APP_HEADER_ACTION_BUTTON_SIZE,
    justifyContent: "center",
    width: APP_HEADER_ACTION_BUTTON_SIZE,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  actionButton: {
    flex: 1,
  },
  activityHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  retryButton: {
    minWidth: 180,
  },
  unavailableText: {
    marginBottom: spacing.md,
    textAlign: "center",
  },
});
