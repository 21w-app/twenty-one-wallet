import { StyleSheet } from "react-native";

import { Screen } from "@/components/Screen";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Text } from "@/components/Text";
import { useI18n } from "@/hooks/useI18n";
import { spacing } from "@/lib/theme";

const ArkProtocolScreen = () => {
  const { t } = useI18n();

  return (
    <Screen header={<ScreenHeader title={t("arkProtocol.title")} />} scroll>
      <Text style={styles.sectionTitle} variant="title">
        {t("arkProtocol.whatIsArkTitle")}
      </Text>
      <Text muted style={styles.body} variant="body">
        {t("arkProtocol.whatIsArkBody")}
      </Text>

      <Text style={styles.sectionTitle} variant="title">
        {t("arkProtocol.caveatsTitle")}
      </Text>
      <Text muted style={styles.body} variant="body">
        {t("arkProtocol.experimentalBody")}
      </Text>
      <Text muted style={styles.body} variant="body">
        {t("arkProtocol.vtxoBody")}
      </Text>
      <Text muted variant="body">
        {t("arkProtocol.selfCustodyBody")}
      </Text>
    </Screen>
  );
};

export default ArkProtocolScreen;

const styles = StyleSheet.create({
  sectionTitle: {
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  body: {
    marginBottom: spacing.md,
  },
});
