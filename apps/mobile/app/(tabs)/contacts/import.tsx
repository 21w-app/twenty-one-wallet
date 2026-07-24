import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet } from "react-native";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Text } from "@/components/Text";
import { useI18n } from "@/hooks/useI18n";
import { useTheme } from "@/hooks/useTheme";
import { setAddressBookImportDraft } from "@/lib/addressBookImportDraft";
import { pickAddressBookImportJsonFile } from "@/lib/pickAddressBookImportJsonFile";
import { parseAddressBookImportJson } from "@/lib/parseAddressBookImportJson";
import { spacing } from "@/lib/theme";

const IMPORT_FORMAT_EXAMPLE = `{
  "version": 1,
  "contacts": [
    {
      "name": "Alice",
      "address": "ark1..."
    }
  ]
}`;

const ImportContactsScreen = () => {
  const router = useRouter();
  const { t } = useI18n();
  const { colors } = useTheme();
  const [parseError, setParseError] = useState<string | null>(null);
  const [isPicking, setIsPicking] = useState(false);

  const handleChooseFile = useCallback(async () => {
    setParseError(null);
    setIsPicking(true);

    try {
      const picked = await pickAddressBookImportJsonFile();

      if (!picked.ok && picked.cancelled) {
        return;
      }

      if (!picked.ok) {
        setParseError(t("addressBook.importReadError"));
        return;
      }

      const parsed = parseAddressBookImportJson(picked.contents);

      if (!parsed.ok) {
        setParseError(t(parsed.errorKey));
        return;
      }

      if (parsed.contacts.length === 0) {
        setParseError(t("addressBook.importEmpty"));
        return;
      }

      setAddressBookImportDraft(parsed.contacts);
      router.push("/contacts/import-preview");
    } finally {
      setIsPicking(false);
    }
  }, [router, t]);

  return (
    <Screen
      header={
        <ScreenHeader
          onBackPress={() => {
            router.back();
          }}
          title={t("addressBook.importTitle")}
        />
      }
      scroll
    >
      <Text style={styles.lead} variant="body">
        {t("addressBook.importBody")}
      </Text>

      <Text muted variant="caption">
        {t("addressBook.importFormatHint")}
      </Text>

      <Card style={styles.exampleCard}>
        <Text selectable style={styles.exampleCode} variant="caption">
          {IMPORT_FORMAT_EXAMPLE}
        </Text>
      </Card>

      <Button
        disabled={isPicking}
        label={
          isPicking
            ? t("addressBook.importChoosingFile")
            : t("addressBook.importChooseFile")
        }
        onPress={() => {
          void handleChooseFile();
        }}
        style={styles.chooseButton}
      />

      {parseError != null ? (
        <Text style={{ color: colors.error }} variant="caption">
          {parseError}
        </Text>
      ) : null}
    </Screen>
  );
};

export default ImportContactsScreen;

const styles = StyleSheet.create({
  lead: {
    marginBottom: spacing.md,
  },
  exampleCard: {
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  exampleCode: {
    fontFamily: "monospace",
  },
  chooseButton: {
    marginBottom: spacing.md,
  },
});
