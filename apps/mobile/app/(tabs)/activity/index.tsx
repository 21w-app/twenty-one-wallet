import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";

import { ActivityListItem } from "@/components/ActivityListItem";
import { Screen } from "@/components/Screen";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Text } from "@/components/Text";
import { WalletGateLoading } from "@/components/WalletGateLoading";
import { useActivity } from "@/hooks/useActivity";
import { useI18n } from "@/hooks/useI18n";
import { useWallet } from "@/hooks/useWallet";
import { getActivityDetailHref } from "@/lib/getActivityDetailHref";
import { spacing } from "@/lib/theme";

const ActivityScreen = () => {
  const router = useRouter();
  const { t } = useI18n();
  const { balanceSats, status, sync } = useWallet();
  const { items, isLoading, error, refresh } = useActivity();
  const [refreshing, setRefreshing] = useState(false);

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
    return <WalletGateLoading />;
  }

  return (
    <Screen
      header={<ScreenHeader title={t("activity.title")} />}
      onRefresh={handleRefresh}
      refreshing={refreshing}
      scroll
    >
      {isLoading && items.length === 0 ? (
        <Text muted variant="body">
          {t("activity.loading")}
        </Text>
      ) : null}

      {error != null && items.length === 0 ? (
        <Text muted style={styles.message} variant="body">
          {error}
        </Text>
      ) : null}

      {error != null && items.length > 0 ? (
        <Text muted style={styles.message} variant="caption">
          {error}
        </Text>
      ) : null}

      {!isLoading && error == null && items.length === 0 ? (
        <Text muted variant="body">
          {t("activity.empty")}
        </Text>
      ) : null}

      <View style={styles.list}>
        {items.map((item, index) => {
          const href = getActivityDetailHref(item);

          return (
            <ActivityListItem
              item={item}
              key={item.id}
              onPress={
                href == null
                  ? undefined
                  : () => {
                      router.push(href);
                    }
              }
              showDivider={index < items.length - 1}
            />
          );
        })}
      </View>
    </Screen>
  );
};

export default ActivityScreen;

const styles = StyleSheet.create({
  list: {
    marginTop: spacing.sm,
  },
  message: {
    marginBottom: spacing.sm,
  },
});
