const ASYNC_STORAGE_TRUE = "true";
const ASYNC_STORAGE_FALSE = "false";

export const readAsyncStorageBoolean = (value: string | null): boolean => {
  return value === ASYNC_STORAGE_TRUE;
};

export const toAsyncStorageBoolean = (enabled: boolean): string => {
  return enabled ? ASYNC_STORAGE_TRUE : ASYNC_STORAGE_FALSE;
};
