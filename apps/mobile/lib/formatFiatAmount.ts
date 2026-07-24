export const formatFiatAmount = (
  sats: number,
  btcFiatRate: number,
  currency: string,
): string => {
  const btcAmount = sats / 100_000_000;
  const fiatAmount = btcAmount * btcFiatRate;

  return new Intl.NumberFormat(undefined, {
    currency: currency.toUpperCase(),
    style: "currency",
    maximumFractionDigits: 2,
  }).format(fiatAmount);
};
