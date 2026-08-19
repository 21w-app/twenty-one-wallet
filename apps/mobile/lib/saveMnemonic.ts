import { rollbackWalletSeed } from "@/lib/rollbackWalletSeed";
import { writeWalletConfiguredFlag } from "@/lib/writeWalletConfiguredFlag";
import { writeWalletSeed } from "@/lib/writeWalletSeed";

export const saveMnemonic = async (mnemonic: string): Promise<void> => {
  if (mnemonic.trim().length === 0) {
    throw new Error("Mnemonic is required");
  }

  try {
    await writeWalletSeed(mnemonic);
    await writeWalletConfiguredFlag();
  } catch (error) {
    await rollbackWalletSeed();
    throw error;
  }
};
