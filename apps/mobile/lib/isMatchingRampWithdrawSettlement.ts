import type { ActivityItem } from "@/lib/activityTypes";
import { isRampSettlementProtocol } from "@/lib/isRampSettlementProtocol";

const RAMP_WITHDRAW_SETTLEMENT_MAX_MS = 7 * 24 * 60 * 60 * 1000;
const RAMP_WITHDRAW_LOCK_MAX_MS = 15 * 60 * 1000;

export const isMatchingRampWithdrawSettlement = (
  arkItem: ActivityItem,
  rampWithdrawItem: ActivityItem,
): boolean => {
  if (arkItem.protocol !== "ark") {
    return false;
  }

  if (
    !isRampSettlementProtocol(rampWithdrawItem.protocol) ||
    rampWithdrawItem.direction !== "sent"
  ) {
    return false;
  }

  if (arkItem.direction !== "sent") {
    return false;
  }

  if (arkItem.amountSats !== rampWithdrawItem.amountSats) {
    return false;
  }

  const arkAfterQuoteMs = arkItem.timestamp - rampWithdrawItem.timestamp;

  if (
    arkAfterQuoteMs >= 0 &&
    arkAfterQuoteMs <= RAMP_WITHDRAW_SETTLEMENT_MAX_MS
  ) {
    return true;
  }

  const rampAfterArkLockMs = rampWithdrawItem.timestamp - arkItem.timestamp;

  return (
    rampAfterArkLockMs >= 0 && rampAfterArkLockMs <= RAMP_WITHDRAW_LOCK_MAX_MS
  );
};
