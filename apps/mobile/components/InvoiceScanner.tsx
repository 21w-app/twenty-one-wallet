import { CameraView, useCameraPermissions } from "expo-camera";
import { Modal, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Text } from "@/components/Text";
import { useI18n } from "@/hooks/useI18n";
import { colors, radii, spacing } from "@/lib/theme";

type InvoiceScannerProps = {
  visible: boolean;
  onClose: () => void;
  onScan: (value: string) => void;
};

export const InvoiceScanner = ({
  visible,
  onClose,
  onScan,
}: InvoiceScannerProps) => {
  const { t } = useI18n();
  const [permission, requestPermission] = useCameraPermissions();
  const insets = useSafeAreaInsets();

  const handleBarcode = (result: { data: string }) => {
    const data = result.data.trim();

    if (data.length === 0) {
      return;
    }

    onScan(data);
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
      statusBarTranslucent={false}
      visible={visible}
    >
      <View
        style={[
          styles.safe,
          {
            paddingBottom: insets.bottom,
            paddingLeft: insets.left,
            paddingRight: insets.right,
            paddingTop: insets.top,
          },
        ]}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <ScreenHeader onBackPress={onClose} title={t("scanner.title")} />
          </View>

          {permission == null ? (
            <Text variant="body">{t("scanner.checkingPermission")}</Text>
          ) : null}

          {permission != null && !permission.granted ? (
            <View style={styles.permissionBlock}>
              <Text variant="body">{t("scanner.permissionBody")}</Text>
              <Button
                label={t("scanner.allowCamera")}
                onPress={() => {
                  void requestPermission();
                }}
                style={styles.permissionButton}
              />
            </View>
          ) : null}

          {permission?.granted ? (
            <View style={styles.cameraWrap}>
              <CameraView
                barcodeScannerSettings={{
                  barcodeTypes: ["qr"],
                }}
                onBarcodeScanned={handleBarcode}
                style={styles.camera}
              />
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safe: {
    backgroundColor: colors.background,
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  header: {
    flexShrink: 0,
  },
  permissionBlock: {
    gap: spacing.md,
  },
  permissionButton: {
    marginTop: spacing.sm,
  },
  cameraWrap: {
    borderRadius: radii.md,
    flex: 1,
    minHeight: 0,
    overflow: "hidden",
  },
  camera: {
    flex: 1,
  },
});
