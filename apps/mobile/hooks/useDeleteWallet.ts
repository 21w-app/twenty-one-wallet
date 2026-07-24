import { useRouter } from "expo-router";
import { useCallback, useState } from "react";

import { useActivity } from "@/hooks/useActivity";
import { useI18n } from "@/hooks/useI18n";
import { useSwaps } from "@/hooks/useSwaps";
import { useWallet } from "@/hooks/useWallet";
import { clearWalletData } from "@/lib/clearWalletData";
import { revokeBackendDevice } from "@/lib/syncBackendDevice";

type UseDeleteWalletResult = {
  deleteWallet: () => Promise<void>;
  error: string | null;
  isDeleting: boolean;
};

export const useDeleteWallet = (): UseDeleteWalletResult => {
  const router = useRouter();
  const { t } = useI18n();
  const { getWallet, releaseWallet } = useWallet();
  const { swaps, resetSwaps } = useSwaps();
  const { clearActivity } = useActivity();
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteWallet = useCallback(async () => {
    setError(null);
    setIsDeleting(true);

    try {
      await clearWalletData({
        swaps,
        revokeBackendRegistration: async () => {
          const wallet = getWallet();

          if (wallet == null) {
            return;
          }

          await revokeBackendDevice({ wallet });
        },
        releaseActiveWallet: async () => {
          resetSwaps();
          clearActivity();
          await releaseWallet();
        },
      });
      router.replace("/welcome");
    } catch {
      setError(t("settings.deleteError"));
      setIsDeleting(false);
    }
  }, [clearActivity, getWallet, releaseWallet, resetSwaps, router, swaps, t]);

  return {
    deleteWallet,
    error,
    isDeleting,
  };
};
