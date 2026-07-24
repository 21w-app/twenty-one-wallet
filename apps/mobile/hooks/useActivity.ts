import { useContext } from "react";

import { ActivityContext } from "@/contexts/ActivityProvider";

export const useActivity = () => {
  const context = useContext(ActivityContext);

  if (context == null) {
    throw new Error("useActivity must be used within ActivityProvider");
  }

  return context;
};
