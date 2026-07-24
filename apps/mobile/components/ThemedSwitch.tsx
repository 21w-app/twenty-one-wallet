import { Switch, SwitchProps } from "react-native";

import { useTheme } from "@/hooks/useTheme";

type ThemedSwitchProps = Omit<
  SwitchProps,
  "trackColor" | "thumbColor" | "ios_backgroundColor"
>;

export const ThemedSwitch = ({ value, ...rest }: ThemedSwitchProps) => {
  const { colors } = useTheme();

  return (
    <Switch
      {...rest}
      ios_backgroundColor={colors.border}
      thumbColor={colors.text}
      trackColor={{ false: colors.border, true: colors.accent }}
      value={value}
    />
  );
};
