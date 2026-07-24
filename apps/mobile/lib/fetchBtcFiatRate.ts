type FiatRateCache = {
  rate: number;
  fetchedAt: number;
};

const CACHE_TTL_MS = 60_000;

const rateCache: { current: FiatRateCache | null } = { current: null };

const readCachedRate = (): number | null => {
  const cached = rateCache.current;

  if (cached == null) {
    return null;
  }

  if (Date.now() - cached.fetchedAt > CACHE_TTL_MS) {
    return null;
  }

  return cached.rate;
};

const writeCachedRate = (rate: number): void => {
  rateCache.current = {
    rate,
    fetchedAt: Date.now(),
  };
};

export const fetchBtcFiatRate = async (
  currency: string,
): Promise<number | null> => {
  const cached = readCachedRate();

  if (cached != null) {
    return cached;
  }

  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=${currency.toLowerCase()}`,
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {
      bitcoin?: Record<string, number>;
    };

    const rate = data.bitcoin?.[currency.toLowerCase()];

    if (rate == null) {
      return null;
    }

    writeCachedRate(rate);
    return rate;
  } catch {
    return null;
  }
};
