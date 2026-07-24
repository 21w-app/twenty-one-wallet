type RefreshWalletAndActivityOptions = {
  syncInBackground: () => Promise<void>;
  refresh: () => Promise<void>;
};

export const refreshWalletAndActivity = async ({
  syncInBackground,
  refresh,
}: RefreshWalletAndActivityOptions): Promise<void> => {
  await syncInBackground();
  await refresh();
};
