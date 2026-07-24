import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";

import { isRemotePushEffectivelyEnabled } from "@/lib/isRemotePushEffectivelyEnabled";
import { subscribePushNotificationsPreference } from "@/lib/pushNotificationsPreference";

type WalletPushEnabledState = {
  isEnabled: boolean | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
};

export const useWalletPushEnabled = (): WalletPushEnabledState => {
  const [isEnabled, setIsEnabled] = useState<boolean | null>(null);

  const refresh = useCallback(async () => {
    const enabled = await isRemotePushEffectivelyEnabled();
    setIsEnabled(enabled);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  useEffect(() => {
    return subscribePushNotificationsPreference(() => {
      void refresh();
    });
  }, [refresh]);

  return {
    isEnabled,
    isLoading: isEnabled === null,
    refresh,
  };
};
