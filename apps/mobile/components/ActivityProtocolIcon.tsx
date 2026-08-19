import { StyleSheet, View } from "react-native";

import { BitcoinSymbolIcon } from "@/components/BitcoinSymbolIcon";
import { Text } from "@/components/Text";
import type { ActivityProtocol, ActivityRamp } from "@/lib/activityTypes";

type ActivityProtocolIconProps = {
  protocol: ActivityProtocol;
  ramp?: ActivityRamp;
  size?: number;
};

export const ActivityProtocolIcon = ({
  ramp,
  size = 40,
}: ActivityProtocolIconProps) => {
  const isBitcoinRamp = ramp != null;
  const accentColor = isBitcoinRamp ? "#F7931A" : "#8F86FF";

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
      {isBitcoinRamp ? (
        <BitcoinSymbolIcon color={accentColor} size={size * 0.54} />
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
