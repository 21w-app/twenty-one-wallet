export const parseExpiresAtSeconds = (
  expiresAt: string | null,
): bigint | null => {
  if (expiresAt == null || expiresAt.trim().length === 0) {
    return null;
  }

  const trimmed = expiresAt.trim();

  if (/^\d+$/.test(trimmed)) {
    return BigInt(trimmed);
  }

  const parsed = Date.parse(trimmed);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return BigInt(Math.floor(parsed / 1000));
};
