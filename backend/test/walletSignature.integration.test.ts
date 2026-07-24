import test from "node:test";
import assert from "node:assert/strict";
import {
  ArkAddress,
  BIP322,
  EsploraProvider,
  InMemoryContractRepository,
  InMemoryWalletRepository,
  MnemonicIdentity,
  RestArkProvider,
  RestIndexerProvider,
  Wallet,
  networks,
} from "@arkade-os/sdk";

import { deriveSignerTaprootAddress } from "../lib/deriveSignerTaprootAddress.js";
import { formatChallengeMessage } from "../lib/formatChallengeMessage.js";
import { verifyWalletSignature } from "../lib/verifyWalletSignature.js";

const TEST_MNEMONIC =
  "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

const ARK_SERVER_URL = "https://arkade.computer";
const ESPLORA_URL = "https://mempool.space/api";

test(
  "static Ark wallet signs with identity taproot address, not vtxoTaprootKey",
  { timeout: 30_000 },
  async (t) => {
    const identity = MnemonicIdentity.fromMnemonic(TEST_MNEMONIC);
    const wallet = await Wallet.create({
      identity,
      arkProvider: new RestArkProvider(ARK_SERVER_URL),
      indexerProvider: new RestIndexerProvider(ARK_SERVER_URL),
      onchainProvider: new EsploraProvider(ESPLORA_URL),
      storage: {
        wallet: new InMemoryWalletRepository(),
        contract: new InMemoryContractRepository(),
      },
      walletMode: "static",
    });

    t.after(async () => {
      await wallet.dispose();
    });

    const arkStaticAddress = await wallet.getAddress();
    const arkAddress = ArkAddress.decode(arkStaticAddress);
    const identityXOnly = await identity.xOnlyPublicKey();
    const signerTaprootAddress = await deriveSignerTaprootAddress(
      wallet.identity,
    );

    assert.notEqual(
      Buffer.compare(arkAddress.vtxoTaprootKey, identityXOnly),
      0,
      "Ark vtxoTaprootKey differs from identity x-only pubkey on static wallets",
    );

    const message = formatChallengeMessage("challenge-id", 1_900_000_000);
    const signature = await BIP322.sign(message, wallet.identity);

    assert.equal(
      verifyWalletSignature(message, signature, signerTaprootAddress),
      true,
    );
    assert.equal(
      BIP322.verify(message, signature, signerTaprootAddress, networks.bitcoin),
      true,
    );
  },
);
