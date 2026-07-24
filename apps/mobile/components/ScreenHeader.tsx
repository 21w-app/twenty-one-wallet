import { Pressable, StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { BackButton } from "@/components/BackButton";
import { Text } from "@/components/Text";
import { useTheme } from "@/hooks/useTheme";
import {
  APP_HEADER_HEIGHT,
  APP_HEADER_MARGIN_BOTTOM,
  APP_HEADER_MARGIN_TOP,
  APP_HEADER_SIDE_WIDTH,
  APP_HEADER_ACTION_BUTTON_SIZE,
  APP_HEADER_ACTION_ICON_SIZE,
} from "@/lib/screenHeaderLayout";
import { spacing } from "@/lib/theme";

type ScreenHeaderIcon = "lightning";
type ScreenHeaderActionIcon = "add" | "edit" | "import";

type ScreenHeaderProps = {
  title: string;
  showBack?: boolean;
  titleIcon?: ScreenHeaderIcon;
  onBackPress?: () => void;
  rightActionIcon?: ScreenHeaderActionIcon;
  rightActionLabel?: string;
  onRightActionPress?: () => void;
};

const ScreenHeaderTitleIcon = ({ name }: { name: ScreenHeaderIcon }) => {
  const { colors } = useTheme();

  if (name === "lightning") {
    return (
      <Svg
        fill="none"
        height={APP_HEADER_ACTION_ICON_SIZE}
        viewBox="0 0 24 24"
        width={APP_HEADER_ACTION_ICON_SIZE}
      >
        <Path
          d="M13 3 6.5 13h5L10.6 21 18 10.5h-5Z"
          stroke={colors.text}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.2}
        />
      </Svg>
    );
  }

  return null;
};

const ScreenHeaderAction = ({
  accessibilityLabel,
  icon,
  onPress,
}: {
  accessibilityLabel?: string;
  icon?: ScreenHeaderActionIcon;
  onPress?: () => void;
}) => {
  const { colors } = useTheme();

  if (icon == null || onPress == null) {
    return null;
  }

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        { backgroundColor: colors.surfaceElevated },
        pressed && styles.pressed,
      ]}
    >
      <Svg
        fill="none"
        height={APP_HEADER_ACTION_ICON_SIZE}
        viewBox="0 0 24 24"
        width={APP_HEADER_ACTION_ICON_SIZE}
      >
        {icon === "add" ? (
          <>
            <Path
              d="M12 5v14"
              stroke={colors.text}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.4}
            />
            <Path
              d="M5 12h14"
              stroke={colors.text}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.4}
            />
          </>
        ) : null}
        {icon === "edit" ? (
          <>
            <Path
              d="M5 19h4.2L18.7 9.5a2.8 2.8 0 0 0-4-4L5.2 15 5 19Z"
              stroke={colors.text}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.1}
            />
            <Path
              d="m13.4 6.8 3.8 3.8"
              stroke={colors.text}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.1}
            />
          </>
        ) : null}
        {icon === "import" ? (
          <>
            <Path
              d="M12 3v12"
              stroke={colors.text}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.2}
            />
            <Path
              d="m7 10 5 5 5-5"
              stroke={colors.text}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.2}
            />
            <Path
              d="M5 21h14"
              stroke={colors.text}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.2}
            />
          </>
        ) : null}
      </Svg>
    </Pressable>
  );
};

const ScreenHeaderTitle = ({
  title,
  titleIcon,
}: {
  title: string;
  titleIcon?: ScreenHeaderIcon;
}) => {
  return (
    <View style={styles.titleWrap}>
      <Text numberOfLines={1} style={styles.title} variant="title">
        {title}
      </Text>
      {titleIcon != null ? <ScreenHeaderTitleIcon name={titleIcon} /> : null}
    </View>
  );
};

export const ScreenHeader = ({
  title,
  showBack = true,
  titleIcon,
  onBackPress,
  rightActionIcon,
  rightActionLabel,
  onRightActionPress,
}: ScreenHeaderProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.side}>
        {showBack ? <BackButton onPress={onBackPress} /> : null}
      </View>
      <ScreenHeaderTitle title={title} titleIcon={titleIcon} />
      <View style={[styles.side, styles.rightSide]}>
        <ScreenHeaderAction
          accessibilityLabel={rightActionLabel}
          icon={rightActionIcon}
          onPress={onRightActionPress}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flexDirection: "row",
    height: APP_HEADER_HEIGHT,
    marginBottom: APP_HEADER_MARGIN_BOTTOM,
    marginTop: APP_HEADER_MARGIN_TOP,
  },
  side: {
    alignItems: "flex-start",
    height: APP_HEADER_HEIGHT,
    justifyContent: "center",
    width: APP_HEADER_SIDE_WIDTH,
  },
  rightSide: {
    alignItems: "flex-end",
  },
  actionButton: {
    alignItems: "center",
    borderRadius: 18,
    height: APP_HEADER_ACTION_BUTTON_SIZE,
    justifyContent: "center",
    width: APP_HEADER_ACTION_BUTTON_SIZE,
  },
  pressed: {
    opacity: 0.7,
  },
  titleWrap: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: spacing.xs,
    height: APP_HEADER_HEIGHT,
    justifyContent: "center",
  },
  title: {
    flexShrink: 1,
    textAlign: "center",
  },
});
