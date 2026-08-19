import type { Env } from "../lib/env.js";
import { prisma } from "../lib/prisma.js";
import { fetchSpendableIndexerVtxos } from "../services/fetchIndexerVtxos.js";
import { sendExpoPush } from "../services/sendExpoPush.js";

const THREE_DAYS_SECONDS = 3n * 24n * 60n * 60n;

export const pollVtxoExpiryReminders = async (env: Env): Promise<void> => {
  const wallets = await prisma.arkWallet.findMany({
    where: {
      devices: {
        some: {
          revoked_at: null,
        },
      },
    },
    include: {
      devices: {
        where: {
          revoked_at: null,
        },
      },
    },
  });

  const nowSeconds = BigInt(Math.floor(Date.now() / 1000));

  for (const wallet of wallets) {
    try {
      await pollWalletVtxoExpiry(env, wallet, nowSeconds);
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      console.warn(
        `vtxo expiry poll failed for ${wallet.vtxo_script_hex}: ${message}`,
      );
    }
  }
};

type WalletWithDevices = {
  vtxo_script_hex: string;
  earliest_expires_at_seconds: bigint | null;
  last_vtxo_reminder_at: Date | null;
  devices: { expo_push_token: string }[];
};

const pollWalletVtxoExpiry = async (
  env: Env,
  wallet: WalletWithDevices,
  nowSeconds: bigint,
): Promise<void> => {
  const vtxos = await fetchSpendableIndexerVtxos(env, wallet.vtxo_script_hex);

  if (vtxos.length === 0) {
    await prisma.arkWallet.update({
      where: { vtxo_script_hex: wallet.vtxo_script_hex },
      data: {
        earliest_expires_at_seconds: null,
        last_polled_at: new Date(),
      },
    });

    return;
  }

  const expiryValues = vtxos
    .map((vtxo: { expiresAtSeconds: bigint | null }) => {
      return vtxo.expiresAtSeconds;
    })
    .filter((value: bigint | null): value is bigint => {
      return value != null;
    });

  if (expiryValues.length === 0) {
    return;
  }

  const earliestExpiry = expiryValues.reduce((min: bigint, value: bigint) => {
    if (value < min) {
      return value;
    }

    return min;
  });

  await prisma.arkWallet.update({
    where: { vtxo_script_hex: wallet.vtxo_script_hex },
    data: {
      earliest_expires_at_seconds: earliestExpiry,
      last_polled_at: new Date(),
    },
  });

  const secondsUntilExpiry = earliestExpiry - nowSeconds;

  if (secondsUntilExpiry > THREE_DAYS_SECONDS) {
    return;
  }

  const cooldownElapsed =
    wallet.last_vtxo_reminder_at == null ||
    Date.now() - wallet.last_vtxo_reminder_at.getTime() >=
      env.vtxoReminderCooldownMs;

  const expiryChanged = wallet.earliest_expires_at_seconds !== earliestExpiry;

  if (!cooldownElapsed && !expiryChanged) {
    return;
  }

  const tokens = wallet.devices.map((device) => {
    return device.expo_push_token;
  });

  await sendExpoPush(
    env,
    tokens.map((token) => {
      return {
        to: token,
        title: "VTXOs expiring soon",
        body: "Ark holds your balance in VTXOs with a limited lifetime. Open 21W soon to refresh their expiry.",
        data: { type: "vtxo_expiry" },
      };
    }),
  );

  await prisma.arkWallet.update({
    where: { vtxo_script_hex: wallet.vtxo_script_hex },
    data: {
      last_vtxo_reminder_at: new Date(),
    },
  });
};
