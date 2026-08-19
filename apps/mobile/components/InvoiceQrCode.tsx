import { StyleSheet, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

import { colors, radii, spacing } from "@/lib/theme";

type InvoiceQrCodeProps = {
  value: string;
};

export const InvoiceQrCode = ({ value }: InvoiceQrCodeProps) => {
  if (value.trim().length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <QRCode
        backgroundColor={colors.background}
        color={colors.text}
        size={220}
        value={value}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    marginVertical: spacing.md,
    padding: spacing.lg,
  },
});
