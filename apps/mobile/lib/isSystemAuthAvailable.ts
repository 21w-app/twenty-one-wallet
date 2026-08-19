import * as LocalAuthentication from "expo-local-authentication";

export const isSystemAuthAvailable = async (): Promise<boolean> => {
  const enrolledLevel = await LocalAuthentication.getEnrolledLevelAsync();

  return enrolledLevel !== LocalAuthentication.SecurityLevel.NONE;
};
