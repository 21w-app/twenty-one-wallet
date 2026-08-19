import { isValidArkAddress } from "@/lib/isValidArkAddress";

export type InvoiceType = "ark" | "unknown";

export const detectInvoiceType = (input: string): InvoiceType => {
  const trimmed = input.trim();

  if (trimmed.length === 0) {
    return "unknown";
  }

  if (isValidArkAddress(trimmed)) {
    return "ark";
  }

  return "unknown";
};
