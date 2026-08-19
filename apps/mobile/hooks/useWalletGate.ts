import { useEffect, useState } from "react";

import { hasWallet } from "@/lib/hasWallet";

type WalletGateState = {
  isLoading: boolean;
  walletPresent: boolean;
};

export const useWalletGate = (): WalletGateState => {
  const [isLoading, setIsLoading] = useState(true);
  const [walletPresent, setWalletPresent] = useState(false);

  useEffect(() => {
    const checkWallet = async () => {
      const present = await hasWallet();
      setWalletPresent(present);
      setIsLoading(false);
    };

    void checkWallet();
  }, []);

  return { isLoading, walletPresent };
};
