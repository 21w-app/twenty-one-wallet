import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";

import { useTheme } from "@/hooks/useTheme";

type CopyIconActionProps = {
  value: string;
  disabled?: boolean;
};

const ICON_SIZE = 22;

export const CopyIconAction = ({
  value,
  disabled = false,
}: CopyIconActionProps) => {
  const { colors } = useTheme();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(value);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const iconColor = copied ? colors.accent : colors.textMuted;

  return (
    <Pressable
      accessibilityLabel={copied ? "Copied" : "Copy"}
      accessibilityRole="button"
      disabled={disabled}
      hitSlop={8}
      onPress={() => {
        void handleCopy();
      }}
      style={({ pressed }) => {
        return [
          styles.iconButton,
          pressed && !disabled ? styles.pressed : null,
          disabled ? styles.disabled : null,
        ];
      }}
    >
      <Svg fill="none" height={ICON_SIZE} viewBox="0 0 24 24" width={ICON_SIZE}>
        <Rect
          height={12}
          rx={2}
          stroke={iconColor}
          strokeWidth={2}
          width={12}
          x={8}
          y={8}
        />
        <Path
          d="M6 16V6a2 2 0 0 1 2-2h10"
          stroke={iconColor}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
        />
      </Svg>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  iconButton: {
    alignItems: "center",
    height: 30,
    justifyContent: "center",
    width: 30,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.4,
  },
});
