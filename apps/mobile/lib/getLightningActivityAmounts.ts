import {
  decodeInvoice,
  type BoltzReverseSwap,
  type BoltzSubmarineSwap,
} from "@arkade-os/boltz-swap";

export type LightningAmountBreakdown = {
  netAmountSats: number;
  invoiceAmountSats: number;
  feeSats: number | null;
};

export const getLightningFundAmounts = (
  swap: BoltzReverseSwap,
): LightningAmountBreakdown => {
  const invoiceAmountSats = swap.request.invoiceAmount;
  const onchainAmount = swap.response.onchainAmount;

  if (onchainAmount != null) {
    return {
      netAmountSats: onchainAmount,
      invoiceAmountSats,
      feeSats: Math.max(0, invoiceAmountSats - onchainAmount),
    };
  }

  return {
    netAmountSats: invoiceAmountSats,
    invoiceAmountSats,
    feeSats: null,
  };
};

export const getLightningWithdrawAmounts = (
  swap: BoltzSubmarineSwap,
): LightningAmountBreakdown => {
  const lockupAmountSats = swap.response.expectedAmount;
  let invoiceAmountSats = lockupAmountSats;

  try {
    invoiceAmountSats = decodeInvoice(swap.request.invoice).amountSats;
  } catch {
    invoiceAmountSats = lockupAmountSats;
  }

  const feeSats =
    lockupAmountSats >= invoiceAmountSats
      ? lockupAmountSats - invoiceAmountSats
      : null;

  return {
    netAmountSats: lockupAmountSats,
    invoiceAmountSats,
    feeSats,
  };
};
