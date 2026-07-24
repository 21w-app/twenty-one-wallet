import { APP_LOGO_MARK_SIZE } from "@/lib/theme";
import { Image, StyleSheet, View } from "react-native";

const logoSource = require("../assets/branding/approved/logo-mark-extracted.png");

// Derived from logo-mark-extracted.png (1091×402).
const LOGO_MARK_ASPECT_RATIO = 1091 / 402;

type LogoMarkProps = {
  size?: number;
};

export const LogoMark = ({ size = APP_LOGO_MARK_SIZE }: LogoMarkProps) => {
  return (
    <View style={styles.container}>
      <Image
        accessibilityLabel="21W logo"
        resizeMode="contain"
        source={logoSource}
        style={{ height: size, width: size * LOGO_MARK_ASPECT_RATIO }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
});
