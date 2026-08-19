import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

import type { ActivityItem } from "@/lib/activityTypes";
import { WALLET_VIEW_CACHE_KEY } from "@/lib/asyncStorageKeys";
import { migrateSecureStoreStringToAsyncStorage } from "@/lib/migrateSecureStoreStringToAsyncStorage";

export const WALLET_VIEW_CACHE_LIMIT = 5;

const WALLET_VIEW_CACHE_VERSION = 1;

const LEGACY_WALLET_VIEW_CACHE_SECURE_STORE_KEY = "wallet_view_cache";

export type WalletViewCache = {
  balanceSats: number;
  address: string;
  activityItems: ActivityItem[];
  syncedAt: number;
};

type WalletViewCachePayload = WalletViewCache & {
  version: number;
};

const isActivityDirection = (
  value: unknown,
): value is ActivityItem["direction"] => {
  return value === "received" || value === "sent";
};

const isActivityStatus = (value: unknown): value is ActivityItem["status"] => {
  return value === "pending" || value === "confirmed" || value === "failed";
};

const isActivityProtocol = (
  value: unknown,
): value is ActivityItem["protocol"] => {
  return value === "ark";
};

const isActivityRamp = (value: unknown): value is ActivityItem["ramp"] => {
  return value === "fund" || value === "withdraw";
};

const isActivityItem = (value: unknown): value is ActivityItem => {
  if (typeof value !== "object" || value == null) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    typeof record.id === "string" &&
    isActivityDirection(record.direction) &&
    typeof record.amountSats === "number" &&
    Number.isFinite(record.amountSats) &&
    typeof record.timestamp === "number" &&
    Number.isFinite(record.timestamp) &&
    isActivityStatus(record.status) &&
    isActivityProtocol(record.protocol) &&
    (record.ramp == null || isActivityRamp(record.ramp))
  );
};

const parseWalletViewCache = (raw: string): WalletViewCache | null => {
  try {
    const parsed: unknown = JSON.parse(raw);

    if (typeof parsed !== "object" || parsed == null) {
      return null;
    }

    const record = parsed as Record<string, unknown>;

    if (record.version !== WALLET_VIEW_CACHE_VERSION) {
      return null;
    }

    if (
      typeof record.balanceSats !== "number" ||
      !Number.isFinite(record.balanceSats)
    ) {
      return null;
    }

    if (typeof record.address !== "string") {
      return null;
    }

    if (
      typeof record.syncedAt !== "number" ||
      !Number.isFinite(record.syncedAt)
    ) {
      return null;
    }

    if (!Array.isArray(record.activityItems)) {
      return null;
    }

    const activityItems = record.activityItems.filter(isActivityItem);

    return {
      balanceSats: record.balanceSats,
      address: record.address,
      activityItems: activityItems.slice(0, WALLET_VIEW_CACHE_LIMIT),
      syncedAt: record.syncedAt,
    };
  } catch {
    return null;
  }
};

const readWalletViewCacheRaw = async (): Promise<string | null> => {
  return migrateSecureStoreStringToAsyncStorage(
    WALLET_VIEW_CACHE_KEY,
    LEGACY_WALLET_VIEW_CACHE_SECURE_STORE_KEY,
  );
};

export const readWalletViewCache =
  async (): Promise<WalletViewCache | null> => {
    const raw = await readWalletViewCacheRaw();

    if (raw == null || raw.length === 0) {
      return null;
    }

    return parseWalletViewCache(raw);
  };

export const writeWalletViewCache = async (
  update: Partial<WalletViewCache>,
): Promise<void> => {
  const existing = await readWalletViewCache();
  const activityItems = update.activityItems ?? existing?.activityItems ?? [];

  const payload: WalletViewCachePayload = {
    version: WALLET_VIEW_CACHE_VERSION,
    balanceSats: update.balanceSats ?? existing?.balanceSats ?? 0,
    address: update.address ?? existing?.address ?? "",
    activityItems: activityItems.slice(0, WALLET_VIEW_CACHE_LIMIT),
    syncedAt: update.syncedAt ?? Date.now(),
  };

  await AsyncStorage.setItem(WALLET_VIEW_CACHE_KEY, JSON.stringify(payload));
};

export const clearWalletViewCache = async (): Promise<void> => {
  await AsyncStorage.removeItem(WALLET_VIEW_CACHE_KEY);
  await SecureStore.deleteItemAsync(LEGACY_WALLET_VIEW_CACHE_SECURE_STORE_KEY);
};

export const clearWalletViewCacheIfSyncedAt = async (
  syncedAt: number,
): Promise<void> => {
  const cached = await readWalletViewCache();

  if (cached?.syncedAt !== syncedAt) {
    return;
  }

  await clearWalletViewCache();
};
