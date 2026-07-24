import { useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";

import { LightningFundPanel } from "@/components/funding/LightningFundPanel";
import { OnChainFundPanel } from "@/components/funding/OnChainFundPanel";
import {
  FundingMethodSegmentControl,
  type FundingMethod,
} from "@/components/FundingMethodSegmentControl";
import { Screen } from "@/components/Screen";
import { ScreenHeader } from "@/components/ScreenHeader";
import { WalletGateLoading } from "@/components/WalletGateLoading";
import { useActivity } from "@/hooks/useActivity";
import { useI18n } from "@/hooks/useI18n";
import { useWallet } from "@/hooks/useWallet";
import { parseFundingMethod } from "@/lib/parseFundingMethod";

const FundingFundScreen = () => {
  const { t } = useI18n();
  const { status, sync } = useWallet();
  const { refresh } = useActivity();
  const params = useLocalSearchParams<{ method?: string }>();
  const initialMethod = useMemo(() => {
    return parseFundingMethod(params.method);
  }, [params.method]);
  const [method, setMethod] = useState<FundingMethod>(initialMethod);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      await sync();
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh, sync]);

  if (status === "loading" || status === "idle") {
    return <WalletGateLoading />;
  }

  return (
    <Screen
      header={<ScreenHeader showBack title={t("funding.fundTitle")} />}
      onRefresh={handleRefresh}
      refreshing={refreshing}
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

      {method === "lightning" ? <LightningFundPanel /> : <OnChainFundPanel />}
    </Screen>
  );
};

export default FundingFundScreen;
