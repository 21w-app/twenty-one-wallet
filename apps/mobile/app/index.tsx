import { Redirect } from "expo-router";

import { WalletGateLoading } from "@/components/WalletGateLoading";
import { useWalletGate } from "@/hooks/useWalletGate";

const Index = () => {
  const { isLoading, walletPresent } = useWalletGate();

  if (isLoading) {
    return <WalletGateLoading />;
  }

  if (walletPresent) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/welcome" />;
};

export default Index;
