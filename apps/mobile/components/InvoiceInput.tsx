import { StyleSheet, TextInput, TextInputProps } from "react-native";

import { useTheme } from "@/hooks/useTheme";
import { spacing } from "@/lib/theme";

type InvoiceInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
} & Pick<TextInputProps, "editable">;

export const InvoiceInput = ({
  value,
  onChangeText,
  placeholder = "Paste invoice or address",
  editable = true,
}: InvoiceInputProps) => {
  const { colors } = useTheme();

  return (
    <TextInput
      autoCapitalize="none"
      autoCorrect={false}
      editable={editable}
      multiline
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textMuted}
      style={[
        styles.input,
        {
          backgroundColor: colors.surfaceElevated,
          borderColor: colors.border,
          color: colors.text,
        },
      ]}
      textAlignVertical="top"
      value={value}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    borderRadius: 14,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 120,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
});
