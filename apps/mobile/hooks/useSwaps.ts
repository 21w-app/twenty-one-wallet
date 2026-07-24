import { useContext } from "react";

import { SwapsContext } from "@/contexts/SwapsProvider";

export const useSwaps = () => {
  const context = useContext(SwapsContext);

  if (context == null) {
    throw new Error("useSwaps must be used within SwapsProvider");
  }

  return context;
};
