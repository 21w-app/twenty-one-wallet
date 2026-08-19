import { createContext, ReactNode, useMemo } from "react";

import { darkColors, type ThemeColors } from "@/lib/themePalettes";

type ThemeContextValue = {
  mode: "dark";
  colors: ThemeColors;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

type ThemeProviderProps = {
  children: ReactNode;
};

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const value = useMemo(() => {
    return {
      mode: "dark" as const,
      colors: darkColors,
    };
  }, []);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
