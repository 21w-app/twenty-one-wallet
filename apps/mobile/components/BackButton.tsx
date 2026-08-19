import { useRouter } from "expo-router";
import { Pressable, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";

import { useI18n } from "@/hooks/useI18n";
import { useTheme } from "@/hooks/useTheme";
import { APP_HEADER_HEIGHT } from "@/lib/screenHeaderLayout";

type BackButtonProps = {
  onPress?: () => void;
};

export const BackButton = ({ onPress }: BackButtonProps) => {
  const router = useRouter();
  const { t } = useI18n();
  const { colors } = useTheme();

  const handlePress = () => {
    if (onPress != null) {
      onPress();
      return;
    }

    router.back();
  };

  return (
    <Pressable
      accessibilityLabel={t("common.goBack")}
      accessibilityRole="button"
      hitSlop={12}
      onPress={handlePress}
      style={styles.button}
    >
      <Svg fill="none" height={24} viewBox="0 0 24 24" width={24}>
        <Path
          d="M15 5 8 12l7 7"
          stroke={colors.text}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.4}
        />
      </Svg>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    alignSelf: "flex-start",
    height: APP_HEADER_HEIGHT,
    justifyContent: "center",
    marginLeft: -4,
    width: 24,
  },
});
