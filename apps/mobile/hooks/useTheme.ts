import { useContext } from "react";

import { ThemeContext } from "@/contexts/ThemeProvider";

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (context == null) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
};
