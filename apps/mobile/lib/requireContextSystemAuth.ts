import {
  isBiometricsOnOpenEnabled,
  setBiometricsOnOpenEnabled,
} from "@/lib/authOnOpenPreference";
import { isBiometricsAvailable } from "@/lib/isBiometricsAvailable";
import {
  requireSystemAuth,
  type SystemAuthResult,
} from "@/lib/requireSystemAuth";

export type SystemAuthContext = "app_open";

type RequireContextSystemAuthOptions = {
  context: SystemAuthContext;
  promptMessage: string;
  cancelLabel?: string;
};

export const requireContextSystemAuth = async (
  options: RequireContextSystemAuthOptions,
): Promise<SystemAuthResult> => {
  let biometricsRequired =
    options.context === "app_open" ? await isBiometricsOnOpenEnabled() : false;

  if (biometricsRequired && !(await isBiometricsAvailable())) {
    await setBiometricsOnOpenEnabled(false);
    biometricsRequired = false;
  }

  return requireSystemAuth({
    promptMessage: options.promptMessage,
    cancelLabel: options.cancelLabel,
    biometricsRequired,
  });
};
