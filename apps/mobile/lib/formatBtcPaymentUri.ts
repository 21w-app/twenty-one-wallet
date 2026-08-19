const SATS_PER_BTC = 100_000_000;

export const formatBtcAmount = (amountSats: number): string => {
  if (!Number.isInteger(amountSats) || amountSats <= 0) {
    throw new Error("amountSats must be a positive integer");
  }

  const whole = Math.floor(amountSats / SATS_PER_BTC);
  const fractional = String(amountSats % SATS_PER_BTC).padStart(8, "0");

  return `${whole}.${fractional}`;
};

export const formatBtcPaymentUri = ({
  address,
  amountSats,
}: {
  address: string;
  amountSats: number;
}): string => {
  return `bitcoin:${address}?amount=${formatBtcAmount(amountSats)}`;
};
