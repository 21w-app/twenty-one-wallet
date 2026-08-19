import { ArkAddress } from "@arkade-os/sdk";

export const isValidArkAddress = (address: string): boolean => {
  try {
    ArkAddress.decode(address);
    return true;
  } catch {
    return false;
  }
};
