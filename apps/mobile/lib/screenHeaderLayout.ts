import { spacing } from "@/lib/theme";

export const APP_HEADER_HEIGHT = 36;

export const APP_HEADER_MARGIN_TOP = spacing.md;

export const APP_HEADER_MARGIN_BOTTOM = spacing.lg;

export const APP_HEADER_ACTION_BUTTON_SIZE = 36;

export const APP_HEADER_ACTION_ICON_SIZE = 24;

export const APP_CONTENT_SECTION_GAP = spacing.xxl;

export const APP_HEADER_TO_CONTENT_SPACING =
  APP_HEADER_MARGIN_BOTTOM + APP_CONTENT_SECTION_GAP;

export const APP_BALANCE_HORIZONTAL_PADDING = spacing.lg;

export const APP_HEADER_SIDE_WIDTH = APP_HEADER_ACTION_BUTTON_SIZE;

export const APP_LOGO_HEIGHT = 28;

export const APP_LOGO_WIDTH = 75;

export const getKeyboardVerticalOffset = (topInset: number): number => {
  return topInset + APP_HEADER_MARGIN_TOP + APP_HEADER_HEIGHT;
};
