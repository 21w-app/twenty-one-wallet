import { prisma } from "../lib/prisma.js";
import { verifyWalletSignature } from "../lib/verifyWalletSignature.js";

export type WalletAuthInput = {
  challengeId: string;
  signature: string;
  signerTaprootAddress: string;
  formatMessage?: (challenge: {
    challengeId: string;
    expiresAtSeconds: number;
  }) => string;
};

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export const consumeAuthChallenge = async (
  input: WalletAuthInput,
): Promise<string> => {
  const challenge = await prisma.authChallenge.findUnique({
    where: { id: input.challengeId },
  });

  if (challenge == null) {
    throw new AuthError("Challenge not found");
  }

  if (challenge.consumed_at != null) {
    throw new AuthError("Challenge already used");
  }

  const nowSeconds = BigInt(Math.floor(Date.now() / 1000));

  if (challenge.expires_at_seconds < nowSeconds) {
    throw new AuthError("Challenge expired");
  }

  const expiresAtSeconds = Number(challenge.expires_at_seconds);
  const message =
    input.formatMessage == null
      ? challenge.message
      : input.formatMessage({
          challengeId: challenge.id,
          expiresAtSeconds,
        });
  const isValid = verifyWalletSignature(
    message,
    input.signature,
    input.signerTaprootAddress,
  );

  if (!isValid) {
    throw new AuthError("Invalid wallet signature");
  }

  const consumed = await prisma.authChallenge.updateMany({
    where: {
      id: challenge.id,
      consumed_at: null,
    },
    data: { consumed_at: new Date() },
  });

  if (consumed.count === 0) {
    throw new AuthError("Challenge already used");
  }

  return message;
};
