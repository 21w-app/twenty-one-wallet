import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";

import { InvoiceScanner } from "@/components/InvoiceScanner";
import { useI18n } from "@/hooks/useI18n";
import { useTheme } from "@/hooks/useTheme";
import { spacing } from "@/lib/theme";

type AddressInputWithScanProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
} & Pick<TextInputProps, "editable">;

export const AddressInputWithScan = ({
  value,
  onChangeText,
  placeholder,
  editable = true,
}: AddressInputWithScanProps) => {
  const { t } = useI18n();
  const { colors } = useTheme();
  const [scannerVisible, setScannerVisible] = useState(false);

  return (
    <View style={styles.wrap}>
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
      <Pressable
        accessibilityLabel={t("common.scanQr")}
        accessibilityRole="button"
        disabled={!editable}
        onPress={() => {
          setScannerVisible(true);
        }}
        style={({ pressed }) => [
          styles.scanButton,
          { backgroundColor: colors.surface },
          pressed && styles.pressed,
          !editable && styles.disabled,
        ]}
      >
        <Svg fill="none" height={28} viewBox="0 0 24 24" width={28}>
          <Path
            d="M5 9V5h4m6 0h4v4m0 6v4h-4M9 19H5v-4M9 12h6"
            stroke={colors.text}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.4}
          />
        </Svg>
      </Pressable>
      <InvoiceScanner
        onClose={() => {
          setScannerVisible(false);
        }}
        onScan={onChangeText}
        visible={scannerVisible}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: "relative",
  },
  input: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 120,
    paddingBottom: 56,
    paddingHorizontal: spacing.lg,
    paddingRight: 72,
    paddingTop: spacing.md,
  },
  scanButton: {
    alignItems: "center",
    borderRadius: 22,
    bottom: spacing.sm,
    height: 44,
    justifyContent: "center",
    position: "absolute",
    right: spacing.sm,
    width: 44,
  },
  pressed: {
    opacity: 0.75,
  },
  disabled: {
    opacity: 0.5,
  },
});
