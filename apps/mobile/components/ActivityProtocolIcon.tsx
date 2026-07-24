import { StyleSheet, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

import { BitcoinSymbolIcon } from "@/components/BitcoinSymbolIcon";
import { Text } from "@/components/Text";
import { useTheme } from "@/hooks/useTheme";
import type { ActivityProtocol } from "@/lib/activityTypes";

type ActivityProtocolIconProps = {
  protocol: ActivityProtocol;
  size?: number;
};

export const ActivityProtocolIcon = ({
  protocol,
  size = 40,
}: ActivityProtocolIconProps) => {
  const { colors } = useTheme();
  const isLightning = protocol === "lightning";
  const isOnchain = protocol === "onchain";
  const accentColor = isLightning || isOnchain ? colors.accent : "#8F86FF";
  const iconSize = size * 0.58;

  return (
    <View
      style={[
        styles.circle,
        {
          borderColor: accentColor,
          height: size,
          width: size,
          borderRadius: size / 2,
        },
      ]}
    >
      {isLightning ? (
        <Svg fill="none" height={iconSize} viewBox="0 0 24 24" width={iconSize}>
          <Circle cx="12" cy="12" fill={colors.surfaceElevated} r="10" />
          <Path
            d="M13 4.5 7.8 12h4l-.8 7.5 5.5-8.8h-4.1Z"
            fill="none"
            stroke={accentColor}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
          />
        </Svg>
      ) : isOnchain ? (
        <BitcoinSymbolIcon color={accentColor} size={iconSize} />
      ) : (
        <Text style={[styles.label, { color: accentColor }]} variant="label">
          A
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  circle: {
    alignItems: "center",
    borderWidth: 1.2,
    justifyContent: "center",
  },
  label: {
    fontWeight: "700",
  },
});
