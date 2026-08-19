import {
  ArkAddress,
  Estimator,
  type ExtendedVirtualCoin,
  type FeeInfo,
} from "@arkade-os/sdk";
import { hex } from "@scure/base";

const MAX_VTXOS_PER_OFFBOARD = 100;
const COLLABORATIVE_EXIT_MIN_EXPIRY_GAP_MS = 696 * 60 * 60 * 1000;

type OffboardOutput = {
  address: string;
  amount: bigint;
};

export type OffboardSettleParams = {
  inputs: ExtendedVirtualCoin[];
  outputs: OffboardOutput[];
};

export type OffboardVtxoSelectionDiagnostics = {
  eligibleBalanceSats: number;
  immatureVtxoCount: number;
  nextEligibleAt: Date | null;
  requiredSpendAmountSats: number;
  selectedInputCount: number;
  totalVtxoCount: number;
};

export type OffboardSettlePreparation = {
  diagnostics: OffboardVtxoSelectionDiagnostics;
  settleParams: OffboardSettleParams;
};

export class ImmatureOffboardVtxosError extends Error {
  readonly eligibleBalanceSats: number;
  readonly immatureVtxoCount: number;
  readonly nextEligibleAt: Date | null;
  readonly requiredSpendAmountSats: number;

  constructor({
    eligibleBalanceSats,
    immatureVtxoCount,
    nextEligibleAt,
    requiredSpendAmountSats,
  }: {
    eligibleBalanceSats: number;
    immatureVtxoCount: number;
    nextEligibleAt: Date | null;
    requiredSpendAmountSats: number;
  }) {
    const nextEligible =
      nextEligibleAt == null ? "unknown" : nextEligibleAt.toISOString();
    super(
      `No mature VTXO set can cover withdrawal. Eligible after-fee balance: ${eligibleBalanceSats} sats; required: ${requiredSpendAmountSats} sats; immature VTXOs: ${immatureVtxoCount}; next eligible: ${nextEligible}`,
    );
    this.name = "ImmatureOffboardVtxosError";
    this.eligibleBalanceSats = eligibleBalanceSats;
    this.immatureVtxoCount = immatureVtxoCount;
    this.nextEligibleAt = nextEligibleAt;
    this.requiredSpendAmountSats = requiredSpendAmountSats;
  }
}

const expiryKey = (vtxo: ExtendedVirtualCoin): number => {
  return vtxo.virtualStatus.batchExpiry ?? Number.POSITIVE_INFINITY;
};

const isRealTimestamp = (timestamp: number): boolean => {
  return new Date(timestamp).getFullYear() >= 2025;
};

const getImmatureUntil = (
  vtxo: ExtendedVirtualCoin,
  nowMs: number,
): Date | null => {
  const expiry = vtxo.virtualStatus.batchExpiry;

  if (expiry == null || !isRealTimestamp(expiry)) {
    return null;
  }

  const latestEligibleExpiry = nowMs + COLLABORATIVE_EXIT_MIN_EXPIRY_GAP_MS;

  if (expiry <= latestEligibleExpiry) {
    return null;
  }

  return new Date(expiry - COLLABORATIVE_EXIT_MIN_EXPIRY_GAP_MS);
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

const getInputSpendableAmountSats = (
  vtxo: ExtendedVirtualCoin,
  estimator: Estimator,
): bigint => {
  const inputFeeSats = BigInt(
    estimator.evalOffchainInput(toOffchainInput(vtxo)).satoshis,
  );

  if (inputFeeSats >= BigInt(vtxo.value)) {
    return 0n;
  }

  return BigInt(vtxo.value) - inputFeeSats;
};

const toSafeSatsNumber = (amount: bigint, label: string): number => {
  if (amount > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(`${label} exceeds a safe satoshi integer`);
  }

  return Number(amount);
};

const deductArkChangeOutputFee = (
  changeAmountSats: bigint,
  arkChangeAddress: string,
  estimator: Estimator,
): bigint => {
  if (changeAmountSats <= 0n) {
    return 0n;
  }

  const outputScript = hex.encode(ArkAddress.decode(arkChangeAddress).pkScript);
  const outputFeeSats = BigInt(
    estimator.evalOffchainOutput({
      amount: changeAmountSats,
      script: outputScript,
    }).satoshis,
  );

  if (outputFeeSats >= changeAmountSats) {
    return 0n;
  }

  return changeAmountSats - outputFeeSats;
};

export const getOffboardSettleParams = ({
  arkChangeAddress,
  destinationAddress,
  dustSats,
  fees,
  nowMs,
  requestedAmountSats,
  spendAmountSats,
  vtxos,
}: {
  arkChangeAddress: string;
  destinationAddress: string;
  dustSats: bigint;
  fees: FeeInfo;
  nowMs: number;
  requestedAmountSats: number;
  spendAmountSats: number;
  vtxos: ExtendedVirtualCoin[];
}): OffboardSettlePreparation => {
  const estimator = new Estimator(fees.intentFee ?? {});
  const immatureUntil = vtxos
    .map((vtxo) => {
      return getImmatureUntil(vtxo, nowMs);
    })
    .filter((eligibleAt): eligibleAt is Date => {
      return eligibleAt != null;
    })
    .sort((left, right) => {
      return left.getTime() - right.getTime();
    });
  const eligibleVtxos = vtxos
    .filter((vtxo) => {
      return getImmatureUntil(vtxo, nowMs) == null;
    })
    .sort((left, right) => {
      return expiryKey(left) - expiryKey(right);
    });
  const selectedInputs: ExtendedVirtualCoin[] = [];
  let selectedAmountSats = 0n;
  let eligibleBalanceSats = 0n;

  for (const vtxo of eligibleVtxos) {
    const spendableAmountSats = getInputSpendableAmountSats(vtxo, estimator);
    eligibleBalanceSats += spendableAmountSats;

    if (
      selectedAmountSats < BigInt(spendAmountSats) &&
      selectedInputs.length < MAX_VTXOS_PER_OFFBOARD &&
      spendableAmountSats > 0n
    ) {
      selectedInputs.push(vtxo);
      selectedAmountSats += spendableAmountSats;
    }
  }

  const diagnostics = {
    eligibleBalanceSats: toSafeSatsNumber(
      eligibleBalanceSats,
      "eligible balance",
    ),
    immatureVtxoCount: immatureUntil.length,
    nextEligibleAt: immatureUntil[0] ?? null,
    requiredSpendAmountSats: spendAmountSats,
    selectedInputCount: selectedInputs.length,
    totalVtxoCount: vtxos.length,
  };

  if (
    selectedAmountSats < BigInt(spendAmountSats) &&
    diagnostics.immatureVtxoCount > 0 &&
    diagnostics.nextEligibleAt != null
  ) {
    throw new ImmatureOffboardVtxosError({
      eligibleBalanceSats: diagnostics.eligibleBalanceSats,
      immatureVtxoCount: diagnostics.immatureVtxoCount,
      nextEligibleAt: diagnostics.nextEligibleAt,
      requiredSpendAmountSats: spendAmountSats,
    });
  }

  if (selectedAmountSats < BigInt(spendAmountSats)) {
    throw new Error(
      `No eligible VTXO set can cover withdrawal. Eligible after-fee balance: ${diagnostics.eligibleBalanceSats} sats; required: ${spendAmountSats} sats; immature VTXOs: ${diagnostics.immatureVtxoCount}`,
    );
  }

  const grossChangeAmountSats = selectedAmountSats - BigInt(spendAmountSats);
  const changeAmountSats = deductArkChangeOutputFee(
    grossChangeAmountSats,
    arkChangeAddress,
    estimator,
  );
  const outputs: OffboardOutput[] = [
    {
      address: destinationAddress,
      amount: BigInt(requestedAmountSats),
    },
  ];

  if (changeAmountSats >= dustSats) {
    outputs.push({
      address: arkChangeAddress,
      amount: changeAmountSats,
    });
  }

  return {
    diagnostics,
    settleParams: {
      inputs: selectedInputs,
      outputs,
    },
  };
};
