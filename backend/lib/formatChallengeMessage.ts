export const formatChallengeMessage = (
  challengeId: string,
  expiresAtSeconds: number,
): string => {
  return [
    "21W device registration",
    `Challenge ID: ${challengeId}`,
    `Expires: ${expiresAtSeconds}`,
  ].join("\n");
};
