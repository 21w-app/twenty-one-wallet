import { useCallback, useState } from "react";

import { OnChainFundPanel } from "@/components/funding/OnChainFundPanel";
import { Screen } from "@/components/Screen";
import { ScreenHeader } from "@/components/ScreenHeader";
import { WalletGateLoading } from "@/components/WalletGateLoading";
import { useActivity } from "@/hooks/useActivity";
import { useI18n } from "@/hooks/useI18n";
import { useWallet } from "@/hooks/useWallet";

const FundingFundScreen = () => {
  const { t } = useI18n();
  const { status, sync } = useWallet();
  const { refresh } = useActivity();
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
      <OnChainFundPanel />
    </Screen>
  );
};

export default FundingFundScreen;
