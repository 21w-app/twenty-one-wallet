import * as SecureStore from "expo-secure-store";

import { ARK_SENT_AMOUNT_OVERRIDES_KEY } from "@/lib/walletKeys";

const ARK_SENT_AMOUNT_OVERRIDES_VERSION = 1;

type ArkSentAmountOverride = {
  arkTxid: string;
  amountSats: number;
  recordedAt: number;
};

type ArkSentAmountOverridesPayload = {
  version: number;
  overrides: ArkSentAmountOverride[];
};

const isOverride = (value: unknown): value is ArkSentAmountOverride => {
  if (typeof value !== "object" || value == null) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    typeof record.arkTxid === "string" &&
    record.arkTxid.length > 0 &&
    typeof record.amountSats === "number" &&
    Number.isFinite(record.amountSats) &&
    record.amountSats > 0 &&
    typeof record.recordedAt === "number" &&
    Number.isFinite(record.recordedAt)
  );
};

const parseOverrides = (raw: string): ArkSentAmountOverride[] => {
  try {
    const parsed: unknown = JSON.parse(raw);

    if (typeof parsed !== "object" || parsed == null) {
      return [];
    }

    const record = parsed as Record<string, unknown>;

    if (record.version !== ARK_SENT_AMOUNT_OVERRIDES_VERSION) {
      return [];
    }

    if (!Array.isArray(record.overrides)) {
      return [];
    }

    return record.overrides.filter(isOverride);
  } catch {
    return [];
  }
};

export const readArkSentAmountOverridesMap = async (): Promise<
  ReadonlyMap<string, number>
> => {
  const raw = await SecureStore.getItemAsync(ARK_SENT_AMOUNT_OVERRIDES_KEY);

  if (raw == null) {
    return new Map();
  }

  const overrides = parseOverrides(raw);
  const map = new Map<string, number>();

  for (const override of overrides) {
    map.set(override.arkTxid, override.amountSats);
  }

  return map;
};

type RecordArkSentAmountOverrideParams = {
  arkTxid: string;
  amountSats: number;
};

export const recordArkSentAmountOverride = async ({
  arkTxid,
  amountSats,
}: RecordArkSentAmountOverrideParams): Promise<void> => {
  if (arkTxid.length === 0 || amountSats <= 0) {
    return;
  }

  const raw = await SecureStore.getItemAsync(ARK_SENT_AMOUNT_OVERRIDES_KEY);
  const existing = raw == null ? [] : parseOverrides(raw);
  const next = existing.filter((override) => {
    return override.arkTxid !== arkTxid;
  });

  next.push({
    arkTxid,
    amountSats,
    recordedAt: Date.now(),
  });

  const payload: ArkSentAmountOverridesPayload = {
    version: ARK_SENT_AMOUNT_OVERRIDES_VERSION,
    overrides: next,
  };

  await SecureStore.setItemAsync(
    ARK_SENT_AMOUNT_OVERRIDES_KEY,
    JSON.stringify(payload),
  );
};

export const clearArkSentAmountOverrides = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(ARK_SENT_AMOUNT_OVERRIDES_KEY);
};
