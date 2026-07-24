let pendingTransactionInitiatedAt: number | null = null;

export const markPendingTransactionStarted = (): void => {
  pendingTransactionInitiatedAt = Date.now();
};

export const clearPendingTransaction = (): void => {
  pendingTransactionInitiatedAt = null;
};

export const hasPendingTransaction = (): boolean => {
  return pendingTransactionInitiatedAt != null;
};
