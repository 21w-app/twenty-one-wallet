import {
  ArkAddress,
  Estimator,
  type ExtendedVirtualCoin,
  type FeeInfo,
} from "@arkade-os/sdk";
import { hex } from "@scure/base";

const MAX_VTXOS_PER_SETTLEMENT = 50;

export type VtxoRenewalSettleParams = {
  inputs: ExtendedVirtualCoin[];
  outputAmountSats: bigint;
};

const expiryKey = (vtxo: ExtendedVirtualCoin): number => {
  return vtxo.virtualStatus.batchExpiry ?? Number.POSITIVE_INFINITY;
};

const toOffchainInput = (vtxo: ExtendedVirtualCoin) => {
  return {
    amount: BigInt(vtxo.value),
    type:
      vtxo.virtualStatus.state === "swept"
        ? ("recoverable" as const)
        : ("vtxo" as const),
    weight: 0,
    birth: vtxo.createdAt,
    expiry:
      vtxo.virtualStatus.batchExpiry == null
        ? undefined
        : new Date(vtxo.virtualStatus.batchExpiry),
  };
};

export const getVtxoRenewalSettleParams = (
  vtxos: ExtendedVirtualCoin[],
  arkAddress: string,
  fees: FeeInfo,
  dustSats: bigint,
): VtxoRenewalSettleParams => {
  const estimator = new Estimator(fees.intentFee ?? {});
  const sortedVtxos = [...vtxos].sort((left, right) => {
    return expiryKey(left) - expiryKey(right);
  });
  const inputs: ExtendedVirtualCoin[] = [];
  let outputAmountSats = 0n;

  for (const vtxo of sortedVtxos) {
    if (inputs.length >= MAX_VTXOS_PER_SETTLEMENT) {
      break;
    }

    const inputFeeSats = BigInt(
      estimator.evalOffchainInput(toOffchainInput(vtxo)).satoshis,
    );

    if (inputFeeSats >= BigInt(vtxo.value)) {
      continue;
    }

    inputs.push(vtxo);
    outputAmountSats += BigInt(vtxo.value) - inputFeeSats;
  }

  if (inputs.length === 0) {
    throw new Error(
      "No spendable VTXOs remain after deducting Ark settlement input fees",
    );
  }

  const outputScript = hex.encode(ArkAddress.decode(arkAddress).pkScript);
  const outputFeeSats = BigInt(
    estimator.evalOffchainOutput({
      amount: outputAmountSats,
      script: outputScript,
    }).satoshis,
  );

  if (outputFeeSats > outputAmountSats) {
    throw new Error(
      `can't deduct Ark settlement output fee (${outputFeeSats} > ${outputAmountSats})`,
    );
  }

  outputAmountSats -= outputFeeSats;

  if (outputAmountSats < dustSats) {
    throw new Error(
      `Ark settlement output ${outputAmountSats} is below dust ${dustSats}`,
    );
  }

  return {
    inputs,
    outputAmountSats,
  };
};
