import { entropyToMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";
import * as Crypto from "expo-crypto";

// 128 bits of entropy → 12-word English mnemonic.
const ENTROPY_BYTES = 16;

export const generateWalletMnemonic = (): string => {
  const entropy = Crypto.getRandomValues(new Uint8Array(ENTROPY_BYTES));

  try {
    return entropyToMnemonic(entropy, wordlist);
  } finally {
    // The mnemonic string keeps the secret; wipe the raw entropy buffer so it
    // does not linger in memory longer than necessary.
    entropy.fill(0);
  }
};
