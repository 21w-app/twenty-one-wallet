import type { Wallet } from "@arkade-os/sdk";

export type BoardingAmountLimits = {
  minSats: number | null;
  maxSats: number | null;
};

const bigintToLimitSats = (value: bigint): number | null => {
  if (value < 0n) {
    return null;
  }

  const asNumber = Number(value);

  if (!Number.isSafeInteger(asNumber)) {
    return null;
  }

  return asNumber;
};

export const getBoardingAmountLimits = async (
  wallet: Wallet,
): Promise<BoardingAmountLimits> => {
  const info = await wallet.arkProvider.getInfo();
  const minSats = bigintToLimitSats(info.utxoMinAmount);
  const maxSats =
    info.utxoMaxAmount === -1n ? null : bigintToLimitSats(info.utxoMaxAmount);

  return { minSats, maxSats };
};
