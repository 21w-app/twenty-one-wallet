export type WalletViewStatus = "idle" | "loading" | "ready" | "error";

export type WalletViewState = {
  status: WalletViewStatus;
  balanceSats: number | null;
  address: string | null;
  error: string | null;
};

export type WalletAction =
  | { type: "load_start" }
  | { type: "hydrate_cache"; balanceSats: number; address: string }
  | { type: "load_success"; balanceSats: number; address: string }
  | { type: "load_error"; error: string }
  | { type: "unlock_error"; error: string }
  | { type: "reset" };

export const initialWalletViewState: WalletViewState = {
  status: "idle",
  balanceSats: null,
  address: null,
  error: null,
};

export const walletReducer = (
  state: WalletViewState,
  action: WalletAction,
): WalletViewState => {
  if (action.type === "load_start") {
    return {
      ...state,
      status: state.balanceSats == null ? "loading" : "ready",
      error: null,
    };
  }

  if (action.type === "hydrate_cache") {
    return {
      ...state,
      balanceSats: action.balanceSats,
      address: action.address,
    };
  }

  if (action.type === "load_success") {
    return {
      status: "ready",
      balanceSats: action.balanceSats,
      address: action.address,
      error: null,
    };
  }

  if (action.type === "load_error") {
    return {
      ...state,
      status: state.balanceSats == null ? "error" : "ready",
      error: action.error,
    };
  }

  if (action.type === "unlock_error") {
    return {
      status: "error",
      balanceSats: null,
      address: null,
      error: action.error,
    };
  }

  return initialWalletViewState;
};
