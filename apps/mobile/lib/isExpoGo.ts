import Constants, { ExecutionEnvironment } from "expo-constants";

export const isExpoGo = (): boolean => {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
};
