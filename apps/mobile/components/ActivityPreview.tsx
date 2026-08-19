import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import { ActivityListItem } from "@/components/ActivityListItem";
import { Text } from "@/components/Text";
import { useActivity } from "@/hooks/useActivity";
import { useI18n } from "@/hooks/useI18n";
import { formatActivityTotalCount } from "@/lib/createTranslator";
import { getActivityDetailHref } from "@/lib/getActivityDetailHref";
import { spacing } from "@/lib/theme";

const PREVIEW_LIMIT = 3;

export const ActivityPreview = () => {
  const router = useRouter();
  const { locale, t } = useI18n();
  const { items, isLoading, error } = useActivity();
  const previewItems = items.slice(0, PREVIEW_LIMIT);
  const totalCount = items.length;

  if (isLoading && previewItems.length === 0) {
    return (
      <Text muted variant="body">
        {t("activity.loading")}
      </Text>
    );
  }

  if (error != null && previewItems.length === 0) {
    return (
      <Text muted style={styles.message} variant="body">
        {error}
      </Text>
    );
  }

  if (previewItems.length === 0) {
    return (
      <Text muted variant="body">
        {t("activity.emptyRecent")}
      </Text>
    );
  }

  return (
    <View style={styles.container}>
      {error != null ? (
        <Text muted style={styles.message} variant="caption">
          {error}
        </Text>
      ) : null}
      <View style={styles.list}>
        {previewItems.map((item) => {
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
            />
          );
        })}
      </View>
      <Text muted style={styles.total} variant="caption">
        {formatActivityTotalCount(locale, t, totalCount)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  list: {
    marginBottom: spacing.xs,
  },
  message: {
    marginBottom: spacing.xs,
  },
  total: {
    textAlign: "center",
  },
});
