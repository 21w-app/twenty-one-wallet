import test from "node:test";
import assert from "node:assert/strict";
import { BIP322, MnemonicIdentity } from "@arkade-os/sdk";
import { hex } from "@scure/base";

import { formatChallengeMessage } from "../lib/formatChallengeMessage.js";
import { formatSyncDeviceAuthMessage } from "../lib/formatDeviceAuthMessage.js";
import { deriveSignerTaprootAddress } from "../lib/deriveSignerTaprootAddress.js";
import { isStaticArkAddressOwnedBySigner } from "../lib/validateStaticArkAddressSigner.js";
import { verifyWalletSignature } from "../lib/verifyWalletSignature.js";

const TEST_MNEMONIC =
  "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
const TEST_ARK_STATIC_ADDRESS =
  "ark1qzpq904am6clw3pgqwyh4p02708fy4xs0hcpwt7rwfdttuxsjameeq5ydpgnhyjuyzeun9sycc5gek0d0a4yphmje25s9lwqdfafk0027450qg";
const ARKADE_SIGNER_PUBKEY =
  "038202bebddeb1f7442803897a85eaf3ce9254d07df0172fc3725ab5f0d097779c";
const ARKADE_UNILATERAL_EXIT_DELAY = 605_184n;

const buildSyncMessage = async (expoPushToken: string): Promise<string> => {
  const identity = MnemonicIdentity.fromMnemonic(TEST_MNEMONIC);
  const signerTaprootAddress = await deriveSignerTaprootAddress(identity);
  const signerXOnlyPublicKey = hex.encode(await identity.xOnlyPublicKey());

  return formatSyncDeviceAuthMessage({
    challengeId: "00000000-0000-4000-8000-000000000000",
    expiresAtSeconds: 1_900_000_000,
    vtxoScriptHex: "AABBCC",
    arkStaticAddress: "ark1example",
    signerTaprootAddress,
    signerXOnlyPublicKey,
    deviceId: "11111111-1111-4111-8111-111111111111",
    expoPushToken,
    platform: "ios",
    appVersion: "1.0.2",
    nativeBuild: "3",
  });
};

test("bound device auth message verifies only the exact sync payload", async () => {
  const identity = MnemonicIdentity.fromMnemonic(TEST_MNEMONIC);
  const signerTaprootAddress = await deriveSignerTaprootAddress(identity);
  const message = await buildSyncMessage("ExponentPushToken[original]");
  const signature = await BIP322.sign(message, identity);

  assert.equal(
    verifyWalletSignature(message, signature, signerTaprootAddress),
    true,
  );
  assert.equal(
    verifyWalletSignature(
      await buildSyncMessage("ExponentPushToken[changed]"),
      signature,
      signerTaprootAddress,
    ),
    false,
  );
});

test("legacy challenge signature does not satisfy bound device auth", async () => {
  const identity = MnemonicIdentity.fromMnemonic(TEST_MNEMONIC);
  const signerTaprootAddress = await deriveSignerTaprootAddress(identity);
  const legacyMessage = formatChallengeMessage(
    "00000000-0000-4000-8000-000000000000",
    1_900_000_000,
  );
  const signature = await BIP322.sign(legacyMessage, identity);

  assert.equal(
    verifyWalletSignature(
      await buildSyncMessage("ExponentPushToken[original]"),
      signature,
      signerTaprootAddress,
    ),
    false,
  );
});

test("static Ark address must be derived from the signer identity", async () => {
  const identity = MnemonicIdentity.fromMnemonic(TEST_MNEMONIC);
  const signerTaprootAddress = await deriveSignerTaprootAddress(identity);
  const signerXOnlyPublicKey = hex.encode(await identity.xOnlyPublicKey());

  assert.equal(
    isStaticArkAddressOwnedBySigner({
      arkStaticAddress: TEST_ARK_STATIC_ADDRESS,
      signerTaprootAddress,
      signerXOnlyPublicKey,
      arkServerPubKey: ARKADE_SIGNER_PUBKEY,
      unilateralExitDelay: ARKADE_UNILATERAL_EXIT_DELAY,
    }),
    true,
  );
  assert.equal(
    isStaticArkAddressOwnedBySigner({
      arkStaticAddress: TEST_ARK_STATIC_ADDRESS,
      signerTaprootAddress:
        "bc1pqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqpqqenm",
      signerXOnlyPublicKey,
      arkServerPubKey: ARKADE_SIGNER_PUBKEY,
      unilateralExitDelay: ARKADE_UNILATERAL_EXIT_DELAY,
    }),
    false,
  );
});
