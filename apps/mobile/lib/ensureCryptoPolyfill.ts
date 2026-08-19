import * as Crypto from "expo-crypto";

const attachGetRandomValues = (target: Crypto): Crypto => {
  return Object.assign(target, { getRandomValues: Crypto.getRandomValues });
};

export const ensureCryptoPolyfill = (): void => {
  if (globalThis.crypto?.getRandomValues != null) {
    return;
  }

  const baseCrypto = globalThis.crypto ?? ({} as Crypto);
  globalThis.crypto = attachGetRandomValues(baseCrypto);
};

ensureCryptoPolyfill();
