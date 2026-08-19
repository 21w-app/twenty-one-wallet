import { Estimator, networks, type FeeInfo } from "@arkade-os/sdk";
import { hex } from "@scure/base";
import { Address, OutScript } from "@scure/btc-signer";

const DESTINATION_NETWORK_NAMES = [
  "bitcoin",
  "regtest",
  "testnet",
  "signet",
  "mutinynet",
] as const;

const MAX_GROSS_UP_ATTEMPTS = 8;

const getDestinationScriptHex = (destinationAddress: string): string => {
  for (const networkName of DESTINATION_NETWORK_NAMES) {
    const network = networks[networkName];

    try {
      const decoded = Address(network).decode(destinationAddress);
      return hex.encode(OutScript.encode(decoded));
    } catch {
      continue;
    }
  }

  throw new Error(
    `Failed to decode destination address: ${destinationAddress}`,
  );
};

const toSafeSatsNumber = (amount: bigint, label: string): number => {
  if (amount > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(`${label} exceeds a safe satoshi integer`);
  }

  return Number(amount);
};

/**
 * `Ramps.offboard(amount)` treats `amount` as a pre-output-fee budget and
 * subtracts `evalOnchainOutput` before creating the destination output.
 * Gross up so the destination receives `netAmountSats`.
 */
export const grossUpOffboardAmountSats = (
  destinationAddress: string,
  fees: FeeInfo,
  netAmountSats: number,
): number => {
  if (!Number.isInteger(netAmountSats) || netAmountSats <= 0) {
    throw new Error("netAmountSats must be a positive integer");
  }

  const script = getDestinationScriptHex(destinationAddress);
  const estimator = new Estimator(fees.intentFee ?? {});
  const netAmount = BigInt(netAmountSats);
  let grossAmount = netAmount;

  for (let attempt = 0; attempt < MAX_GROSS_UP_ATTEMPTS; attempt += 1) {
    const outputFeeSats = BigInt(
      estimator.evalOnchainOutput({
        amount: grossAmount,
        script,
      }).satoshis,
    );

    if (outputFeeSats > grossAmount) {
      throw new Error(
        `can't deduct fees from offboard amount (${outputFeeSats} > ${grossAmount})`,
      );
    }

    if (grossAmount - outputFeeSats === netAmount) {
      return toSafeSatsNumber(grossAmount, "offboard amount");
    }

    grossAmount = netAmount + outputFeeSats;
  }

  throw new Error(
    "Could not size the offboard amount so the destination receives the requested sats",
  );
};
