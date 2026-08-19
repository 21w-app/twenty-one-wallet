export const isStaleIndexerSubscriptionError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error);

  return /subscription(?:\s+\S+)?\s+not\s+found/i.test(message);
};
