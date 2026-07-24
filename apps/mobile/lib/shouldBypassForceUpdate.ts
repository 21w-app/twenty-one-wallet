import { isExpoGo } from "@/lib/isExpoGo";

export const shouldBypassForceUpdate = (): boolean => {
  if (__DEV__) {
    return true;
  }

  return isExpoGo();
};
