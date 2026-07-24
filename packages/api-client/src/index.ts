import { client } from "./generated/client.gen";

export const configureApiClient = (baseUrl: string): void => {
  client.setConfig({
    baseURL: baseUrl.replace(/\/$/, ""),
  });
};

export {
  createAuthChallenge,
  getAppConfig,
  getHealth,
  revokeDevice,
  syncDevice,
} from "./generated/sdk.gen";

export type {
  AppConfig,
  AuthChallengeResponse,
  SyncDeviceRequest,
  SyncDeviceResponse,
} from "./generated/types.gen";

export { Platform as ApiPlatform } from "./generated/types.gen";

export {
  isAuthChallengeResponse,
  isSyncDeviceResponse,
  readSdkErrorMessage,
} from "./unwrapSdkResponse";

export { useAppConfigQuery } from "./hooks/useAppConfigQuery";
