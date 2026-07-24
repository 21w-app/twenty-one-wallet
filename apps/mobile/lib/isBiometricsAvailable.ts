import * as LocalAuthentication from "expo-local-authentication";

export const isBiometricsAvailable = async (): Promise<boolean> => {
  const [hasHardware, isEnrolled] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ]);

  return hasHardware && isEnrolled;
};
