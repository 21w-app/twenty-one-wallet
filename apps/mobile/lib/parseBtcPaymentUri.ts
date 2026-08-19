type ParsedBtcPaymentUri = {
  address: string;
  amountSats: number | null;
};

const parseAmountSatsFromBtc = (amountBtc: string): number | null => {
  const btc = Number.parseFloat(amountBtc);

  if (!Number.isFinite(btc) || btc <= 0) {
    return null;
  }

  return Math.round(btc * 100_000_000);
};

export const parseBtcPaymentUri = (scanned: string): ParsedBtcPaymentUri => {
  const trimmed = scanned.trim();

  if (!trimmed.toLowerCase().startsWith("bitcoin:")) {
    return { address: trimmed, amountSats: null };
  }

  const withoutScheme = trimmed.slice("bitcoin:".length);
  const queryIndex = withoutScheme.indexOf("?");
  const addressPart =
    queryIndex === -1 ? withoutScheme : withoutScheme.slice(0, queryIndex);
  const address = addressPart.trim();

  if (queryIndex === -1) {
    return { address, amountSats: null };
  }

  const query = withoutScheme.slice(queryIndex + 1);
  const amountBtc = new URLSearchParams(query).get("amount");
  const amountSats =
    amountBtc == null ? null : parseAmountSatsFromBtc(amountBtc);

  return { address, amountSats };
};
