import { refreshWalletAndActivity } from "@/lib/refreshWalletAndActivity";

type HandleIncomingFundsNotificationResponseOptions = {
  syncInBackground: () => Promise<void>;
  refresh: () => Promise<void>;
};

export const handleIncomingFundsNotificationResponse = async ({
  syncInBackground,
  refresh,
}: HandleIncomingFundsNotificationResponseOptions): Promise<void> => {
  try {
    await refreshWalletAndActivity({ syncInBackground, refresh });
  } catch {
    // Non-fatal — user can pull to refresh.
  }
};
