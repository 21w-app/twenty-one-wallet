import { Platform } from "react-native";

import { spacing } from "@/lib/theme";

export const TAB_BAR_PADDING_TOP = 10;

const TAB_BAR_ICON_HEIGHT = 31;

const TAB_BAR_ICON_LABEL_GAP = 2;

const TAB_BAR_LABEL_HEIGHT = 12;

const ANDROID_TAB_BAR_MIN_BOTTOM_INSET = spacing.md;

const ANDROID_TAB_BAR_EXTRA_BOTTOM_INSET = spacing.sm;

export const getTabBarBottomInset = (safeAreaBottom: number): number => {
  if (Platform.OS !== "android") {
    return safeAreaBottom;
  }

  return (
    Math.max(safeAreaBottom, ANDROID_TAB_BAR_MIN_BOTTOM_INSET) +
    ANDROID_TAB_BAR_EXTRA_BOTTOM_INSET
  );
};

export const getTabBarHeight = (tabBarBottomInset: number): number => {
  return (
    TAB_BAR_PADDING_TOP +
    TAB_BAR_ICON_HEIGHT +
    TAB_BAR_ICON_LABEL_GAP +
    TAB_BAR_LABEL_HEIGHT +
    tabBarBottomInset
  );
};

export const getTabBarScrollBottomInset = (safeAreaBottom: number): number => {
  const tabBarBottomInset = getTabBarBottomInset(safeAreaBottom);

  return getTabBarHeight(tabBarBottomInset) + spacing.sm;
};
