import { useEffect, useState } from "react";
import { getLocales } from "expo-localization";

import { fetchBtcFiatRate } from "@/lib/fetchBtcFiatRate";
import { formatFiatAmount } from "@/lib/formatFiatAmount";

const getLocaleCurrency = (): string => {
  const locales = getLocales();
  const currency = locales[0]?.currencyCode;

  if (currency == null || currency.length === 0) {
    return "USD";
  }

  return currency;
};

export const useFiatEquivalent = (sats: number | null) => {
  const [fiatLabel, setFiatLabel] = useState<string | null>(null);

  useEffect(() => {
    if (sats == null) {
      setFiatLabel(null);
      return;
    }

    const loadFiat = async () => {
      const currency = getLocaleCurrency();
      const rate = await fetchBtcFiatRate(currency);

      if (rate == null) {
        setFiatLabel(null);
        return;
      }

      setFiatLabel(formatFiatAmount(sats, rate, currency));
    };

    void loadFiat();
  }, [sats]);

  return fiatLabel;
};
