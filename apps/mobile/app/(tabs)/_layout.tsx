import { Redirect, Tabs } from "expo-router";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TabIcon } from "@/components/TabIcon";
import { WalletGateLoading } from "@/components/WalletGateLoading";
import { useI18n } from "@/hooks/useI18n";
import { useTheme } from "@/hooks/useTheme";
import { useWalletGate } from "@/hooks/useWalletGate";
import {
  getTabBarBottomInset,
  getTabBarHeight,
  TAB_BAR_PADDING_TOP,
} from "@/lib/tabBarLayout";

const TabLayout = () => {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { isLoading, walletPresent } = useWalletGate();
  const insets = useSafeAreaInsets();
  const tabBarBottomInset = getTabBarBottomInset(insets.bottom);
  const tabBarHeight = getTabBarHeight(tabBarBottomInset);

  if (isLoading) {
    return <WalletGateLoading />;
  }

  if (!walletPresent) {
    return <Redirect href="/welcome" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopWidth: 0,
          elevation: 0,
          height: tabBarHeight,
          paddingBottom: tabBarBottomInset,
          paddingTop: TAB_BAR_PADDING_TOP,
        },
        tabBarItemStyle: styles.tabBarItem,
        tabBarIconStyle: styles.tabBarIcon,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.wallet"),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon color={color} focused={focused} name="wallet" />
          ),
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: t("tabs.contacts"),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon color={color} focused={focused} name="contacts" />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t("tabs.settings"),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon color={color} focused={focused} name="settings" />
          ),
        }}
      />
      <Tabs.Screen name="activity" options={{ href: null }} />
      <Tabs.Screen name="funding" options={{ href: null }} />
      <Tabs.Screen name="lightning" options={{ href: null }} />
      <Tabs.Screen name="receive" options={{ href: null }} />
      <Tabs.Screen name="send" options={{ href: null }} />
      <Tabs.Screen name="address-book" options={{ href: null }} />
      <Tabs.Screen name="contacts/new" options={{ href: null }} />
      <Tabs.Screen name="contacts/detail" options={{ href: null }} />
    </Tabs>
  );
};

export default TabLayout;

const styles = StyleSheet.create({
  tabBarItem: {
    paddingVertical: 0,
  },
  tabBarIcon: {
    marginBottom: 2,
  },
  tabBarLabel: {
    marginBottom: 0,
    marginTop: 0,
  },
});
