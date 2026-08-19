import type { Wallet } from "@arkade-os/sdk";

import {
  getOffboardSettleParams,
  type OffboardVtxoSelectionDiagnostics,
} from "@/lib/getOffboardSettleParams";
import { grossUpOffboardAmountSats } from "@/lib/grossUpOffboardAmountSats";
import {
  logLightningFundDebug,
  logLightningFundError,
} from "@/lib/logLightningFundDebug";

const VTXO_REFRESH_FILTER = {
  withRecoverable: true,
  withUnrolled: false,
} as const;

const refreshWalletVtxos = async (wallet: Wallet): Promise<void> => {
  const contractManager = await wallet.getContractManager();
  await contractManager.refreshVtxos({ includeInactive: true });
};

const formatOffboardDiagnostics = (
  diagnostics: OffboardVtxoSelectionDiagnostics,
): string => {
  const nextEligible =
    diagnostics.nextEligibleAt == null
      ? "none"
      : diagnostics.nextEligibleAt.toISOString();

  return `vtxos: total=${diagnostics.totalVtxoCount}, selected=${diagnostics.selectedInputCount}, immature=${diagnostics.immatureVtxoCount}, eligibleAfterFees=${diagnostics.eligibleBalanceSats}, required=${diagnostics.requiredSpendAmountSats}, nextEligible=${nextEligible}`;
};

class OffboardSettleError extends Error {
  constructor(error: unknown, diagnostics: OffboardVtxoSelectionDiagnostics) {
    const message = error instanceof Error ? error.message : String(error);

    super(`${message}\n${formatOffboardDiagnostics(diagnostics)}`);
    this.name = error instanceof Error ? error.name : "OffboardSettleError";
    this.cause = error;
  }
}

export const offboardToBtcAddress = async (
  wallet: Wallet,
  destinationAddress: string,
  amountSats: number,
): Promise<string> => {
  const finalized = await wallet.finalizePendingTxs();

  logLightningFundDebug("onchain-withdraw", "finalized pending txs", {
    finalizedCount: finalized.finalized.length,
    pendingCount: finalized.pending.length,
  });

  await refreshWalletVtxos(wallet);

  const info = await wallet.arkProvider.getInfo();
  const fees = info.fees;
  const [arkChangeAddress, vtxos] = await Promise.all([
    wallet.getAddress(),
    wallet.getVtxos(VTXO_REFRESH_FILTER),
  ]);
  const spendAmountSats = grossUpOffboardAmountSats(
    destinationAddress,
    fees,
    amountSats,
  );
  const { diagnostics, settleParams } = getOffboardSettleParams({
    arkChangeAddress,
    destinationAddress,
    dustSats: info.dust,
    fees,
    nowMs: Date.now(),
    requestedAmountSats: amountSats,
    spendAmountSats,
    vtxos,
  });

  logLightningFundDebug("onchain-withdraw", "prepared offboard settlement", {
    destinationAmountSats: amountSats,
    immatureVtxoCount: diagnostics.immatureVtxoCount,
    inputCount: settleParams.inputs.length,
    nextEligibleAt: diagnostics.nextEligibleAt?.toISOString() ?? null,
    outputCount: settleParams.outputs.length,
    spendAmountSats,
    vtxoCount: vtxos.length,
  });

  try {
    return await wallet.settle(settleParams);
  } catch (offboardError) {
    logLightningFundError(
      "onchain-withdraw",
      "offboard failed after native ramp preparation",
      offboardError,
      {
        diagnostics,
        finalized,
        settleParams,
        spendAmountSats,
        destinationAddress,
      },
    );
    throw new OffboardSettleError(offboardError, diagnostics);
  }
};
