import { useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SelectField } from "@/components/SelectField";
import { Text } from "@/components/Text";
import { useI18n } from "@/hooks/useI18n";
import { useTheme } from "@/hooks/useTheme";
import { APP_LOCALE_OPTIONS } from "@/lib/appLocaleOptions";
import { spacing } from "@/lib/theme";

export const LanguageSelector = () => {
  const { colors } = useTheme();
  const { locale, setLocale, t } = useI18n();
  const insets = useSafeAreaInsets();
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = useMemo(() => {
    return (
      APP_LOCALE_OPTIONS.find((option) => {
        return option.locale === locale;
      }) ?? APP_LOCALE_OPTIONS[0]
    );
  }, [locale]);

  const closePicker = () => {
    setIsOpen(false);
  };

  const handleSelect = (nextLocale: typeof locale) => {
    void setLocale(nextLocale);
    closePicker();
  };

  return (
    <>
      <SelectField
        accessibilityHint={t("settings.selectLanguage")}
        expanded={isOpen}
        label={t("settings.language")}
        onPress={() => {
          setIsOpen(true);
        }}
        value={t(selectedOption.labelKey)}
        valuePrefix={
          <Text style={styles.flag} variant="body">
            {selectedOption.flag}
          </Text>
        }
      />

      <Modal
        animationType="fade"
        onRequestClose={closePicker}
        transparent
        visible={isOpen}
      >
        <View style={styles.modalRoot}>
          <Pressable
            accessibilityLabel={t("common.cancel")}
            onPress={closePicker}
            style={styles.backdrop}
          />
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: colors.surfaceElevated,
                paddingBottom: Math.max(insets.bottom, spacing.md),
              },
            ]}
          >
            <Text muted style={styles.sheetTitle} variant="caption">
              {t("settings.language")}
            </Text>
            {APP_LOCALE_OPTIONS.map((option, index) => {
              const isSelected = locale === option.locale;
              const isLast = index === APP_LOCALE_OPTIONS.length - 1;

              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  key={option.locale}
                  onPress={() => {
                    handleSelect(option.locale);
                  }}
                  style={({ pressed }) => {
                    return [
                      styles.option,
                      !isLast ? styles.optionBorder : null,
                      { borderBottomColor: colors.border },
                      pressed ? styles.optionPressed : null,
                    ];
                  }}
                >
                  <Text style={styles.flag} variant="body">
                    {option.flag}
                  </Text>
                  <Text style={styles.optionLabel} variant="body">
                    {t(option.labelKey)}
                  </Text>
                  {isSelected ? (
                    <Text accent style={styles.checkmark} variant="label">
                      ✓
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  flag: {
    fontSize: 22,
    lineHeight: 26,
    width: 28,
  },
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
    paddingTop: spacing.md,
  },
  sheetTitle: {
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    textTransform: "uppercase",
  },
  option: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  optionBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionPressed: {
    opacity: 0.85,
  },
  optionLabel: {
    flex: 1,
  },
  checkmark: {
    width: 20,
  },
});
