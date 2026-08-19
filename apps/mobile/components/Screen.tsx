import { BottomTabBarHeightContext } from "@react-navigation/bottom-tabs";
import { ReactNode, useContext } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import {
  Edge,
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { useTheme } from "@/hooks/useTheme";
import { useKeyboardBottomInset } from "@/hooks/useKeyboardBottomInset";
import { getKeyboardVerticalOffset } from "@/lib/screenHeaderLayout";
import { spacing } from "@/lib/theme";

type ScreenProps = {
  children: ReactNode;
  header?: ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  keyboardAvoiding?: boolean;
  onRefresh?: () => void | Promise<void>;
  refreshing?: boolean;
};

const TAB_SAFE_AREA_EDGES: Edge[] = ["top", "left", "right"];
const FULL_SAFE_AREA_EDGES: Edge[] = ["top", "left", "right", "bottom"];

const KEYBOARD_SCROLL_BOTTOM_PADDING = spacing.xxxl;

export const Screen = ({
  children,
  header,
  scroll = false,
  style,
  keyboardAvoiding = true,
  onRefresh,
  refreshing = false,
}: ScreenProps) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const inTabNavigator = useContext(BottomTabBarHeightContext) !== undefined;
  const safeAreaEdges = inTabNavigator
    ? TAB_SAFE_AREA_EDGES
    : FULL_SAFE_AREA_EDGES;
  const hasRefresh = onRefresh != null;
  const isScrollable = scroll || hasRefresh;
  const keyboardBottomInset = useKeyboardBottomInset(
    keyboardAvoiding && isScrollable,
  );
  const bottomPadding =
    (isScrollable ? KEYBOARD_SCROLL_BOTTOM_PADDING : spacing.xl) +
    keyboardBottomInset;
  const keyboardVerticalOffset = getKeyboardVerticalOffset(insets.top);
  const useIosScrollKeyboardInsets =
    keyboardAvoiding && isScrollable && Platform.OS === "ios";
  const useKeyboardAvoidingView =
    keyboardAvoiding && !useIosScrollKeyboardInsets;

  const refreshControl =
    onRefresh == null ? undefined : (
      <RefreshControl
        onRefresh={() => {
          void onRefresh();
        }}
        refreshing={refreshing}
        tintColor={colors.accent}
      />
    );

  const content = isScrollable ? (
    <ScrollView
      alwaysBounceVertical={hasRefresh}
      automaticallyAdjustKeyboardInsets={useIosScrollKeyboardInsets}
      bounces={hasRefresh}
      contentContainerStyle={[
        scroll ? styles.contentScroll : styles.contentRefresh,
        { backgroundColor: colors.background, paddingBottom: bottomPadding },
        style,
      ]}
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      refreshControl={refreshControl}
      scrollEnabled={scroll}
      showsVerticalScrollIndicator={false}
      style={styles.flex}
    >
      {children}
    </ScrollView>
  ) : (
    <View
      style={[
        styles.content,
        header != null ? styles.contentBelowHeader : undefined,
        { backgroundColor: colors.background, paddingBottom: bottomPadding },
        style,
      ]}
    >
      {children}
    </View>
  );

  const layout =
    header == null ? (
      content
    ) : (
      <View style={styles.flex}>
        <View style={styles.headerSlot}>{header}</View>
        {content}
      </View>
    );

  const body = useKeyboardAvoidingView ? (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={keyboardVerticalOffset}
      style={styles.flex}
    >
      {layout}
    </KeyboardAvoidingView>
  ) : (
    layout
  );

  return (
    <SafeAreaView
      edges={safeAreaEdges}
      style={[styles.safe, { backgroundColor: colors.background }]}
    >
      {body}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  contentBelowHeader: {
    flex: 1,
  },
  headerSlot: {
    flexShrink: 0,
    paddingHorizontal: spacing.md,
  },
  contentScroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
  },
  contentRefresh: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
  },
});
