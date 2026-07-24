import { useContext } from "react";

import { WalletContext } from "@/contexts/WalletProvider";

export const useWallet = () => {
  const context = useContext(WalletContext);

  if (context == null) {
    throw new Error("useWallet must be used within WalletProvider");
  }

  return context;
};
