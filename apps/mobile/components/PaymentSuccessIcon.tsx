import { StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { useTheme } from "@/hooks/useTheme";

const ICON_SIZE = 80;

export const PaymentSuccessIcon = () => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.circle,
        {
          borderColor: colors.success,
          height: ICON_SIZE,
          width: ICON_SIZE,
          borderRadius: ICON_SIZE / 2,
        },
      ]}
    >
      <Svg fill="none" height={36} viewBox="0 0 24 24" width={36}>
        <Path
          d="M5 13l4 4L19 7"
          stroke={colors.success}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.8}
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  circle: {
    alignItems: "center",
    borderWidth: 2,
    justifyContent: "center",
  },
});
