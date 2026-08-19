import type { Wallet } from "@arkade-os/sdk";

import { getVtxoRenewalSettleParams } from "@/lib/getVtxoRenewalSettleParams";

const VTXO_REFRESH_FILTER = {
  withRecoverable: true,
  withUnrolled: false,
} as const;

export type OffboardVtxoRenewalResult = {
  renewed: boolean;
  expiringVtxoCount: number;
  renewalTxid: string | null;
  vtxoTxids: string[];
};

// Collaborative exit rejects VTXOs inside the operator minExpiryGap. The SDK
// "expiring soon" filter can skip those coins, so settle every spendable VTXO
// into a fresh batch before offboard.
export const renewVtxosBeforeOffboard = async (
  wallet: Wallet,
): Promise<OffboardVtxoRenewalResult> => {
  const vtxos = await wallet.getVtxos(VTXO_REFRESH_FILTER);

  if (vtxos.length === 0) {
    return {
      renewed: false,
      expiringVtxoCount: 0,
      renewalTxid: null,
      vtxoTxids: [],
    };
  }

  const [address, info] = await Promise.all([
    wallet.getAddress(),
    wallet.arkProvider.getInfo(),
  ]);
  const { inputs, outputAmountSats } = getVtxoRenewalSettleParams(
    vtxos,
    address,
    info.fees,
    info.dust,
  );
  const vtxoTxids = inputs.map((vtxo) => {
    return vtxo.txid;
  });
  const renewalTxid = await wallet.settle({
    inputs,
    outputs: [
      {
        address,
        amount: outputAmountSats,
      },
    ],
  });

  await wallet.getBalance();
  await wallet.getVtxos(VTXO_REFRESH_FILTER);

  return {
    renewed: true,
    expiringVtxoCount: inputs.length,
    renewalTxid,
    vtxoTxids,
  };
};
