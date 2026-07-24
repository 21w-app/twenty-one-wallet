const BOLTZ_VISIBLE_ASCII_MEMO_PATTERN = /^[\x20-\x7E]{0,500}$/;

export const getLightningFundInvoiceDescription = (): string => {
  return "21W wallet fund";
};

export const toBoltzInvoiceMemo = (memo: string): string | undefined => {
  const trimmed = memo.trim();

  if (trimmed.length === 0) {
    return undefined;
  }

  const asciiOnly = trimmed
    .split("")
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code >= 0x20 && code <= 0x7e;
    })
    .join("")
    .slice(0, 500);

  if (
    asciiOnly.length === 0 ||
    !BOLTZ_VISIBLE_ASCII_MEMO_PATTERN.test(asciiOnly)
  ) {
    return undefined;
  }

  return asciiOnly;
};
