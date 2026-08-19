import { ArkAddress } from "@arkade-os/sdk";
import { hex } from "@scure/base";

export const validateVtxoScriptHex = (
  vtxoScriptHex: string,
  arkStaticAddress: string,
): boolean => {
  try {
    const decoded = ArkAddress.decode(arkStaticAddress);
    const scriptHex = hex.encode(decoded.pkScript);

    return scriptHex.toLowerCase() === vtxoScriptHex.toLowerCase();
  } catch {
    return false;
  }
};
