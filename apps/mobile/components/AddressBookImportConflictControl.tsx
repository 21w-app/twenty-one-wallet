import { Pressable, StyleSheet, View } from "react-native";

import { Text } from "@/components/Text";
import { useTheme } from "@/hooks/useTheme";
import type { AddressBookConflictResolution } from "@/lib/mergeImportedAddressBookContacts";
import { spacing } from "@/lib/theme";

type AddressBookImportConflictControlProps = {
  value: AddressBookConflictResolution | undefined;
  onChange: (value: AddressBookConflictResolution) => void;
  importedLabel: string;
  currentLabel: string;
};

const options: AddressBookConflictResolution[] = ["imported", "current"];

export const AddressBookImportConflictControl = ({
  value,
  onChange,
  importedLabel,
  currentLabel,
}: AddressBookImportConflictControlProps) => {
  const { colors } = useTheme();
  const labels: Record<AddressBookConflictResolution, string> = {
    imported: importedLabel,
    current: currentLabel,
  };

  return (
    <View
      style={[styles.container, { backgroundColor: colors.surfaceElevated }]}
    >
      {options.map((option) => {
        const isActive = option === value;

        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            key={option}
            onPress={() => {
              onChange(option);
            }}
            style={[
              styles.segment,
              isActive ? { backgroundColor: colors.background } : undefined,
            ]}
          >
            <Text
              style={isActive ? { color: colors.text } : undefined}
              variant="caption"
            >
              {labels[option]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    flexDirection: "row",
    gap: spacing.xs,
    padding: spacing.xs,
  },
  segment: {
    alignItems: "center",
    borderRadius: 10,
    flex: 1,
    justifyContent: "center",
    minHeight: 34,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
  },
});
