import { Address } from "@scure/btc-signer";
import { networks } from "@arkade-os/sdk";

export const isValidBtcAddress = (address: string): boolean => {
  const trimmed = address.trim();

  if (trimmed.length === 0) {
    return false;
  }

  try {
    Address(networks.bitcoin).decode(trimmed);
    return true;
  } catch {
    return false;
  }
};
