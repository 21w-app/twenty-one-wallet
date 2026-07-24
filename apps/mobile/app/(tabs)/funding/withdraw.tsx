import { useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";

import { LightningWithdrawPanel } from "@/components/funding/LightningWithdrawPanel";
import { OnChainWithdrawPanel } from "@/components/funding/OnChainWithdrawPanel";
import {
  FundingMethodSegmentControl,
  type FundingMethod,
} from "@/components/FundingMethodSegmentControl";
import { Screen } from "@/components/Screen";
import { ScreenHeader } from "@/components/ScreenHeader";
import { WalletGateLoading } from "@/components/WalletGateLoading";
import { useI18n } from "@/hooks/useI18n";
import { useWallet } from "@/hooks/useWallet";
import { parseFundingMethod } from "@/lib/parseFundingMethod";

const FundingWithdrawScreen = () => {
  const { t } = useI18n();
  const { status } = useWallet();
  const params = useLocalSearchParams<{ method?: string }>();
  const initialMethod = useMemo(() => {
    return parseFundingMethod(params.method);
  }, [params.method]);
  const [method, setMethod] = useState<FundingMethod>(initialMethod);

  if (status === "loading" || status === "idle") {
    return <WalletGateLoading />;
  }

  return (
    <Screen
      header={<ScreenHeader showBack title={t("funding.withdrawTitle")} />}
      scroll
    >
      <FundingMethodSegmentControl
        labels={{
          lightning: t("funding.segmentLightning"),
          bitcoin: t("funding.segmentBitcoin"),
        }}
        onChange={setMethod}
        value={method}
      />

      {method === "lightning" ? (
        <LightningWithdrawPanel />
      ) : (
        <OnChainWithdrawPanel />
      )}
    </Screen>
  );
};

export default FundingWithdrawScreen;
