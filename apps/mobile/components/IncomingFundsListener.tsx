import { useIncomingFundsListener } from "@/hooks/useIncomingFundsListener";
import { useWalletActivityRefreshOnResume } from "@/hooks/useWalletActivityRefreshOnResume";

export const IncomingFundsListener = () => {
  useIncomingFundsListener();
  useWalletActivityRefreshOnResume();

  return null;
};
