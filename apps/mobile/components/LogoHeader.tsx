import { Image, StyleSheet, View } from "react-native";

import { Text } from "@/components/Text";
import { APP_LOGO_HEIGHT, APP_LOGO_WIDTH } from "@/lib/screenHeaderLayout";
import { spacing } from "@/lib/theme";

const logoDarkSource = require("../assets/branding/approved/logo-header.png");

type LogoHeaderProps = {
  subtitle?: string;
};

export const LogoHeader = ({ subtitle }: LogoHeaderProps) => {
  return (
    <View style={styles.container}>
      <Image
        accessibilityLabel="21W"
        resizeMode="contain"
        source={logoDarkSource}
        style={styles.logo}
      />
      {subtitle != null ? (
        <Text muted style={styles.subtitle} variant="caption">
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "flex-start",
    gap: spacing.xs,
    justifyContent: "center",
  },
  logo: {
    height: APP_LOGO_HEIGHT,
    width: APP_LOGO_WIDTH,
  },
  subtitle: {
    fontSize: 11,
    lineHeight: 13,
  },
});
