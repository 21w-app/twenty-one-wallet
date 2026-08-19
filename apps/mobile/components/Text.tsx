import { Text as RNText, TextProps as RNTextProps } from "react-native";

import { useTheme } from "@/hooks/useTheme";
import { typography } from "@/lib/theme";

type TextVariant = keyof typeof typography;

type TextProps = RNTextProps & {
  variant?: TextVariant;
  muted?: boolean;
  accent?: boolean;
};

export const Text = ({
  variant = "body",
  muted = false,
  accent = false,
  style,
  ...rest
}: TextProps) => {
  const { colors } = useTheme();

  const color = accent ? colors.accent : muted ? colors.textMuted : colors.text;

  return <RNText style={[typography[variant], { color }, style]} {...rest} />;
};
