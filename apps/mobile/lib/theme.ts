export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 48,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
} as const;

export const typography = {
  titleLarge: {
    fontSize: 32,
    fontWeight: "700" as const,
    lineHeight: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: "600" as const,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
    lineHeight: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "500" as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 14,
    fontWeight: "400" as const,
    lineHeight: 20,
  },
} as const;

export const theme = {
  spacing,
  radii,
  typography,
} as const;

// Static dark palette for StyleSheet modules that cannot use hooks yet.
export { darkColors as colors } from "@/lib/themePalettes";

// Form error styles: import from "@/lib/formErrorTextStyle" (kept separate to avoid a theme cycle).

export const APP_LOGO_MARK_SIZE = 48;
