import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { CopyShareActions } from "@/components/CopyShareActions";
import { InvoiceQrCode } from "@/components/InvoiceQrCode";
import { Screen } from "@/components/Screen";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Text } from "@/components/Text";
import { WalletGateLoading } from "@/components/WalletGateLoading";
import { useI18n } from "@/hooks/useI18n";
import { useWallet } from "@/hooks/useWallet";
import { getArkReceiveInvoice } from "@/lib/getArkReceiveInvoice";
import { spacing } from "@/lib/theme";

const ReceiveScreen = () => {
  const { t } = useI18n();
  const { getWallet, status } = useWallet();
  const [arkInvoice, setArkInvoice] = useState<string | null>(null);

  useEffect(() => {
    const loadArkInvoice = async () => {
      const wallet = getWallet();

      if (wallet == null) {
        setArkInvoice(null);
        return;
      }

      const invoice = await getArkReceiveInvoice(wallet);
      setArkInvoice(invoice);
    };

    if (status === "ready") {
      void loadArkInvoice();
    }
  }, [getWallet, status]);

  if (status === "loading" || status === "idle") {
    return <WalletGateLoading />;
  }

  const arkAddress = arkInvoice ?? "";

  return (
    <Screen header={<ScreenHeader title={t("receive.title")} />} scroll>
      <Text style={styles.description} variant="body">
        {t("receive.body")}
      </Text>

      <View style={styles.section}>
        <Text variant="label">{t("receive.addressLabel")}</Text>
        <Text selectable style={styles.value} variant="body">
          {arkAddress.length > 0 ? arkAddress : "—"}
        </Text>
        {arkAddress.length > 0 ? (
          <>
            <InvoiceQrCode value={arkAddress} />
            <CopyShareActions value={arkAddress} />
          </>
        ) : null}
      </View>
    </Screen>
  );
};

export default ReceiveScreen;

const styles = StyleSheet.create({
  description: {
    marginBottom: spacing.lg,
  },
  section: {
    marginTop: spacing.sm,
  },
  value: {
    marginTop: spacing.sm,
  },
});
