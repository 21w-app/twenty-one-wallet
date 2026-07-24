import { BottomTabBarHeightContext } from "@react-navigation/bottom-tabs";
import { useContext } from "react";

export const useOptionalBottomTabBarHeight = (): number | undefined => {
  return useContext(BottomTabBarHeightContext);
};
