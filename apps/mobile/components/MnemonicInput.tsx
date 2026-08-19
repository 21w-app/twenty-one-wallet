import { StyleSheet, TextInput, TextInputProps } from "react-native";

import { useI18n } from "@/hooks/useI18n";
import { colors, spacing } from "@/lib/theme";

type MnemonicInputProps = {
  value: string;
  onChangeText: (text: string) => void;
} & Pick<TextInputProps, "editable">;

export const MnemonicInput = ({
  value,
  onChangeText,
  editable = true,
}: MnemonicInputProps) => {
  const { t } = useI18n();

  return (
    <TextInput
      autoCapitalize="none"
      autoCorrect={false}
      editable={editable}
      multiline
      onChangeText={onChangeText}
      placeholder={t("mnemonic.placeholder")}
      placeholderTextColor={colors.textMuted}
      style={styles.input}
      textAlignVertical="top"
      value={value}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 14,
    color: colors.text,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 160,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
});
