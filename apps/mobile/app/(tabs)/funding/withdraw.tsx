import { OnChainWithdrawPanel } from "@/components/funding/OnChainWithdrawPanel";
import { Screen } from "@/components/Screen";
import { ScreenHeader } from "@/components/ScreenHeader";
import { WalletGateLoading } from "@/components/WalletGateLoading";
import { useI18n } from "@/hooks/useI18n";
import { useWallet } from "@/hooks/useWallet";

const FundingWithdrawScreen = () => {
  const { t } = useI18n();
  const { status } = useWallet();

  if (status === "loading" || status === "idle") {
    return <WalletGateLoading />;
  }

  return (
    <Screen
      header={<ScreenHeader showBack title={t("funding.withdrawTitle")} />}
      scroll
    >
      <OnChainWithdrawPanel />
    </Screen>
  );
};

export default FundingWithdrawScreen;
