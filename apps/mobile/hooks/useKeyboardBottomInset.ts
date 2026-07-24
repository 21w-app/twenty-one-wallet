import { useEffect, useState } from "react";
import { Keyboard, Platform } from "react-native";

import { spacing } from "@/lib/theme";

const KEYBOARD_EXTRA_BOTTOM_PADDING = spacing.lg;

export const useKeyboardBottomInset = (enabled: boolean): number => {
  const [keyboardInset, setKeyboardInset] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setKeyboardInset(0);
      return;
    }

    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSubscription = Keyboard.addListener(showEvent, () => {
      setKeyboardInset(KEYBOARD_EXTRA_BOTTOM_PADDING);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardInset(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [enabled]);

  return keyboardInset;
};
