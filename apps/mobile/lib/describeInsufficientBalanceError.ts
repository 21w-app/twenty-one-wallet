import type { TranslateFn } from "@/lib/createTranslator";
import { formatSats } from "@/lib/formatSats";

export const describeInsufficientBalanceError = (
  amountSats: number,
  availableBalanceSats: number | null,
  t: TranslateFn,
): string | null => {
  if (availableBalanceSats == null) {
    return null;
  }

  if (amountSats > availableBalanceSats) {
    return t("send.insufficientBalance", {
      amount: formatSats(availableBalanceSats),
    });
  }

  return null;
};
