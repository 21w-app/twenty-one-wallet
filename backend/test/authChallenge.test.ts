import test from "node:test";
import assert from "node:assert/strict";
import { BIP322, MnemonicIdentity } from "@arkade-os/sdk";

import { formatChallengeMessage } from "../lib/formatChallengeMessage.js";
import { parseExpiresAtSeconds } from "../lib/parseExpiresAtSeconds.js";
import { verifyWalletSignature } from "../lib/verifyWalletSignature.js";
import { deriveSignerTaprootAddress } from "../lib/deriveSignerTaprootAddress.js";

const TEST_MNEMONIC =
  "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

test("formatChallengeMessage includes challenge id and expiry", () => {
  const message = formatChallengeMessage("abc-123", 1_700_000_000);

  assert.match(message, /abc-123/);
  assert.match(message, /1700000000/);
});

test("parseExpiresAtSeconds accepts unix second strings", () => {
  assert.equal(parseExpiresAtSeconds("1700000000"), 1_700_000_000n);
});

test("parseExpiresAtSeconds accepts ISO timestamps", () => {
  const parsed = parseExpiresAtSeconds("2024-01-01T00:00:00.000Z");

  assert.equal(parsed, 1_704_067_200n);
});

test("verifyWalletSignature accepts BIP322 signatures for identity taproot address", async () => {
  const identity = MnemonicIdentity.fromMnemonic(TEST_MNEMONIC);
  const signerTaprootAddress = await deriveSignerTaprootAddress(identity);
  const message = formatChallengeMessage("challenge-id", 1_900_000_000);
  const signature = await BIP322.sign(message, identity);
  const isValid = verifyWalletSignature(
    message,
    signature,
    signerTaprootAddress,
  );

  assert.equal(isValid, true);
  assert.equal(
    verifyWalletSignature(message, signature, "bc1pnotavalidaddress"),
    false,
  );
});
