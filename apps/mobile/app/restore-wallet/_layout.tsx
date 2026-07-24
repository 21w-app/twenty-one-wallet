import { Redirect, Stack } from "expo-router";

import { WalletGateLoading } from "@/components/WalletGateLoading";
import { useWalletGate } from "@/hooks/useWalletGate";
import { colors } from "@/lib/theme";

const RestoreWalletLayout = () => {
  const { isLoading, walletPresent } = useWalletGate();

  if (isLoading) {
    return <WalletGateLoading />;
  }

  if (walletPresent) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
};

export default RestoreWalletLayout;
