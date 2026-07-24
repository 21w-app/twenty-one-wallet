export type ThemeColors = {
  background: string;
  surface: string;
  surfaceElevated: string;
  text: string;
  textMuted: string;
  accent: string;
  border: string;
  success: string;
  error: string;
  errorShade: string;
  receiveButtonBackground: string;
  receiveButtonText: string;
  sendButtonBackground: string;
  sendButtonText: string;
  arkAccent: string;
  statusBarStyle: "light" | "dark";
};

export const darkColors: ThemeColors = {
  background: "#000000",
  surface: "#161616",
  surfaceElevated: "#2B2B2B",
  text: "#FFFFFF",
  textMuted: "#8E8E93",
  accent: "#F7931A",
  border: "#333333",
  success: "#34C759",
  error: "#FF453A",
  errorShade: "rgba(255, 69, 58, 0.55)",
  receiveButtonBackground: "#FFFFFF",
  receiveButtonText: "#000000",
  sendButtonBackground: "#2B2B2B",
  sendButtonText: "#FFFFFF",
  arkAccent: "#4A9EFF",
  statusBarStyle: "light",
};
