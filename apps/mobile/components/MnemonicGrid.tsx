import { StyleSheet, View } from "react-native";

import { Card } from "@/components/Card";
import { Text } from "@/components/Text";
import { spacing } from "@/lib/theme";

type MnemonicGridProps = {
  words: string[];
};

export const MnemonicGrid = ({ words }: MnemonicGridProps) => {
  return (
    <View style={styles.grid}>
      {words.map((word, index) => {
        return (
          <Card key={`${index}-${word}`} style={styles.wordCard}>
            <Text muted variant="caption">
              {index + 1}
            </Text>
            <Text variant="label">{word}</Text>
          </Card>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  wordCard: {
    minWidth: "47%",
    paddingVertical: spacing.sm,
  },
});
