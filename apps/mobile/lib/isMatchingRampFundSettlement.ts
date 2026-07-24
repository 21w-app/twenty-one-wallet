import type { ActivityItem } from "@/lib/activityTypes";
import { isRampSettlementProtocol } from "@/lib/isRampSettlementProtocol";

const RAMP_FUND_SETTLEMENT_MAX_MS = 7 * 24 * 60 * 60 * 1000;
const RAMP_FUND_CREDIT_FIRST_MAX_MS = 15 * 60 * 1000;

export const isMatchingRampFundSettlement = (
  arkItem: ActivityItem,
  rampFundItem: ActivityItem,
): boolean => {
  if (arkItem.protocol !== "ark") {
    return false;
  }

  if (
    !isRampSettlementProtocol(rampFundItem.protocol) ||
    rampFundItem.direction !== "received"
  ) {
    return false;
  }

  if (arkItem.direction !== "received") {
    return false;
  }

  if (arkItem.amountSats !== rampFundItem.amountSats) {
    return false;
  }

  const arkAfterQuoteMs = arkItem.timestamp - rampFundItem.timestamp;

  if (arkAfterQuoteMs >= 0 && arkAfterQuoteMs <= RAMP_FUND_SETTLEMENT_MAX_MS) {
    return true;
  }

  const rampAfterArkCreditMs = rampFundItem.timestamp - arkItem.timestamp;

  return (
    rampAfterArkCreditMs >= 0 &&
    rampAfterArkCreditMs <= RAMP_FUND_CREDIT_FIRST_MAX_MS
  );
};
