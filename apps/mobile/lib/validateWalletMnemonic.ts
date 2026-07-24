import { validateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";

import type { TranslateFn } from "@/lib/createTranslator";
import { normalizeMnemonicInput } from "@/lib/normalizeMnemonicInput";

const EXPECTED_WORD_COUNT = 12;

export type MnemonicValidationResult =
  | { valid: true; mnemonic: string }
  | { valid: false; error: string };

export const validateWalletMnemonic = (
  input: string,
  t: TranslateFn,
): MnemonicValidationResult => {
  const mnemonic = normalizeMnemonicInput(input);
  const words = mnemonic.length === 0 ? [] : mnemonic.split(" ");

  if (words.length !== EXPECTED_WORD_COUNT) {
    return {
      valid: false,
      error: t("mnemonic.wordCountError", { count: words.length }),
    };
  }

  if (!validateMnemonic(mnemonic, wordlist)) {
    return {
      valid: false,
      error: t("mnemonic.invalid"),
    };
  }

  return { valid: true, mnemonic };
};
