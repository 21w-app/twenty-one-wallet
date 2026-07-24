import { ArkAddress } from "@arkade-os/sdk";
import { decodeInvoice, isValidArkAddress } from "@arkade-os/boltz-swap";

export type InvoiceType = "ark" | "lightning" | "unknown";

export const detectInvoiceType = (input: string): InvoiceType => {
  const trimmed = input.trim();

  if (trimmed.length === 0) {
    return "unknown";
  }

  if (trimmed.toLowerCase().startsWith("ln")) {
    try {
      decodeInvoice(trimmed);
      return "lightning";
    } catch {
      return "unknown";
    }
  }

  if (isValidArkAddress(trimmed)) {
    return "ark";
  }

  try {
    ArkAddress.decode(trimmed);
    return "ark";
  } catch {
    return "unknown";
  }
};
