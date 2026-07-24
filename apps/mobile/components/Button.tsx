import { useMemo } from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import Svg, { Path } from "react-native-svg";

import { Text } from "@/components/Text";
import { useTheme } from "@/hooks/useTheme";
import { dismissKeyboard } from "@/lib/dismissKeyboard";
import { spacing } from "@/lib/theme";

type ButtonVariant = "primary" | "secondary" | "receive" | "send";
type ButtonIconName = "receive" | "send" | "scan" | "lightning";

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  icon?: ButtonIconName;
};

export const Button = ({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  style,
  icon,
}: ButtonProps) => {
  const { colors } = useTheme();

  const variantStyles = useMemo(() => {
    return {
      primary: {
        container: {
          backgroundColor: colors.accent,
        },
        labelColor: colors.background,
      },
      secondary: {
        container: {
          backgroundColor: colors.surfaceElevated,
        },
        labelColor: colors.text,
      },
      receive: {
        container: {
          backgroundColor: colors.receiveButtonBackground,
        },
        labelColor: colors.receiveButtonText,
      },
      send: {
        container: {
          backgroundColor: colors.sendButtonBackground,
        },
        labelColor: colors.sendButtonText,
      },
    } satisfies Record<
      ButtonVariant,
      { container: ViewStyle; labelColor: string }
    >;
  }, [colors]);

  const { container, labelColor } = variantStyles[variant];

  const handlePress = () => {
    dismissKeyboard();
    onPress?.();
  };

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.base,
        container,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <View style={styles.content}>
        {icon != null ? <ButtonIcon color={labelColor} name={icon} /> : null}
        <Text style={[styles.label, { color: labelColor }]} variant="label">
          {label}
        </Text>
      </View>
    </Pressable>
  );
};

const ButtonIcon = ({
  color,
  name,
}: {
  color: string;
  name: ButtonIconName;
}) => {
  return (
    <Svg fill="none" height={18} viewBox="0 0 24 24" width={18}>
      {name === "receive" ? (
        <Path
          d="M12 4v14m0 0 4.5-4.5M12 18l-4.5-4.5"
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.4}
        />
      ) : null}
      {name === "send" ? (
        <Path
          d="M12 20V6m0 0 4.5 4.5M12 6l-4.5 4.5"
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.4}
        />
      ) : null}
      {name === "scan" ? (
        <Path
          d="M5 9V5h4m6 0h4v4m0 6v4h-4M9 19H5v-4M9 12h6"
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.4}
        />
      ) : null}
      {name === "lightning" ? (
        <Path
          d="M13 3 6 13h5l-1 8 8-11h-5z"
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.2}
        />
      ) : null}
    </Svg>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: 14,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontWeight: "600",
  },
  content: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
  },
});
