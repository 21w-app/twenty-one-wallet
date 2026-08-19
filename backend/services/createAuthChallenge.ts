import type { Env } from "../lib/env.js";
import { formatChallengeMessage } from "../lib/formatChallengeMessage.js";
import { prisma } from "../lib/prisma.js";

export type AuthChallengeResponse = {
  challengeId: string;
  message: string;
  expiresAtSeconds: number;
};

export const createAuthChallenge = async (
  env: Env,
): Promise<AuthChallengeResponse> => {
  const expiresAtSeconds =
    Math.floor(Date.now() / 1000) + env.challengeTtlSeconds;
  const challenge = await prisma.authChallenge.create({
    data: {
      message: "",
      expires_at_seconds: BigInt(expiresAtSeconds),
    },
  });

  const message = formatChallengeMessage(challenge.id, expiresAtSeconds);

  await prisma.authChallenge.update({
    where: { id: challenge.id },
    data: { message },
  });

  return {
    challengeId: challenge.id,
    message,
    expiresAtSeconds,
  };
};
