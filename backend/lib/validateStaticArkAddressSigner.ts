import {
  ArkAddress,
  CSVMultisigTapscript,
  MultisigTapscript,
  RestArkProvider,
  VtxoScript,
  networks,
} from "@arkade-os/sdk";
import { hex } from "@scure/base";
import { Address, OutScript, p2tr } from "@scure/btc-signer";

const deriveSignerTaprootAddress = (
  signerXOnlyPublicKey: Uint8Array,
): string => {
  const payment = p2tr(signerXOnlyPublicKey, undefined, networks.bitcoin);
  const decoded = OutScript.decode(payment.script);

  return Address(networks.bitcoin).encode(decoded);
};

const decodeSignerXOnlyPublicKey = (
  signerXOnlyPublicKey: string,
): Uint8Array | null => {
  try {
    const decoded = hex.decode(signerXOnlyPublicKey);

    if (decoded.length !== 32) {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
};

const signerTaprootAddressMatchesPublicKey = (
  signerTaprootAddress: string,
  signerXOnlyPublicKey: Uint8Array,
): boolean => {
  try {
    return (
      deriveSignerTaprootAddress(signerXOnlyPublicKey) === signerTaprootAddress
    );
  } catch {
    return false;
  }
};

const readXOnlyServerPubKey = (serverPubKey: string): Uint8Array => {
  const decoded = hex.decode(serverPubKey);

  return decoded.length === 33 ? decoded.slice(1) : decoded;
};

const readExitTimelock = (
  unilateralExitDelay: bigint,
): { value: bigint; type: "blocks" | "seconds" } => {
  return {
    value: unilateralExitDelay,
    type: unilateralExitDelay < 512n ? "blocks" : "seconds",
  };
};

export const isStaticArkAddressOwnedBySigner = ({
  arkStaticAddress,
  signerTaprootAddress,
  signerXOnlyPublicKey,
  arkServerPubKey,
  unilateralExitDelay,
}: {
  arkStaticAddress: string;
  signerTaprootAddress: string;
  signerXOnlyPublicKey: string;
  arkServerPubKey: string;
  unilateralExitDelay: bigint;
}): boolean => {
  try {
    const arkAddress = ArkAddress.decode(arkStaticAddress);
    const signerPubKey = decodeSignerXOnlyPublicKey(signerXOnlyPublicKey);

    if (signerPubKey == null) {
      return false;
    }

    if (
      !signerTaprootAddressMatchesPublicKey(signerTaprootAddress, signerPubKey)
    ) {
      return false;
    }

    const serverPubKey = readXOnlyServerPubKey(arkServerPubKey);

    if (hex.encode(arkAddress.serverPubKey) !== hex.encode(serverPubKey)) {
      return false;
    }

    const forfeitScript = MultisigTapscript.encode({
      pubkeys: [signerPubKey, serverPubKey],
    }).script;
    const exitScript = CSVMultisigTapscript.encode({
      timelock: readExitTimelock(unilateralExitDelay),
      pubkeys: [signerPubKey],
    }).script;
    const expectedScript = new VtxoScript([forfeitScript, exitScript]);

    return (
      hex.encode(arkAddress.pkScript) === hex.encode(expectedScript.pkScript)
    );
  } catch {
    return false;
  }
};

export const validateStaticArkAddressSigner = async ({
  arkStaticAddress,
  signerTaprootAddress,
  signerXOnlyPublicKey,
  arkServerUrl,
}: {
  arkStaticAddress: string;
  signerTaprootAddress: string;
  signerXOnlyPublicKey: string;
  arkServerUrl: string;
}): Promise<boolean> => {
  const info = await new RestArkProvider(arkServerUrl).getInfo();

  return isStaticArkAddressOwnedBySigner({
    arkStaticAddress,
    signerTaprootAddress,
    signerXOnlyPublicKey,
    arkServerPubKey: info.signerPubkey,
    unilateralExitDelay: info.unilateralExitDelay,
  });
};
