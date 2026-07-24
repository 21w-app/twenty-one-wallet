import { Platform, StyleSheet, TextInput, TextInputProps } from "react-native";

import { useTheme } from "@/hooks/useTheme";
import { spacing } from "@/lib/theme";

type SatsInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
} & Pick<TextInputProps, "editable">;

export const SatsInput = ({
  value,
  onChangeText,
  placeholder = "Amount in sats",
  editable = true,
}: SatsInputProps) => {
  const { colors } = useTheme();

  return (
    <TextInput
      autoCapitalize="none"
      autoCorrect={false}
      editable={editable}
      keyboardType="number-pad"
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textMuted}
      textAlignVertical="center"
      style={[
        styles.input,
        {
          backgroundColor: colors.surfaceElevated,
          borderColor: colors.border,
          color: colors.text,
        },
      ]}
      value={value}
    />
  );
};

const INPUT_HEIGHT = 52;

const styles = StyleSheet.create({
  input: {
    borderRadius: 14,
    fontSize: 16,
    height: INPUT_HEIGHT,
    paddingHorizontal: spacing.lg,
    ...Platform.select({
      android: {
        includeFontPadding: false,
        paddingVertical: 0,
      },
      default: {
        paddingBottom: (INPUT_HEIGHT - 16) / 2,
        paddingTop: (INPUT_HEIGHT - 16) / 2,
      },
    }),
  },
});
