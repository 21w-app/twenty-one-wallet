import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AddressBookImportConflictControl } from "@/components/AddressBookImportConflictControl";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Text } from "@/components/Text";
import { useI18n } from "@/hooks/useI18n";
import { useTheme } from "@/hooks/useTheme";
import {
  clearAddressBookImportDraft,
  getAddressBookImportDraft,
} from "@/lib/addressBookImportDraft";
import {
  buildAddressBookImportPreview,
  type AddressBookImportPreview,
} from "@/lib/buildAddressBookImportPreview";
import {
  mergeImportedAddressBookContacts,
  type AddressBookConflictResolution,
} from "@/lib/mergeImportedAddressBookContacts";
import { spacing } from "@/lib/theme";

const ImportContactsPreviewScreen = () => {
  const router = useRouter();
  const { t } = useI18n();
  const { colors } = useTheme();
  const [preview, setPreview] = useState<AddressBookImportPreview | null>(null);
  const [resolutions, setResolutions] = useState<
    Record<string, AddressBookConflictResolution>
  >({});
  const [importError, setImportError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    const loadPreview = async () => {
      const draft = getAddressBookImportDraft();

      if (draft == null || draft.length === 0) {
        router.replace("/contacts/import");
        return;
      }

      const nextPreview = await buildAddressBookImportPreview(draft);
      setPreview(nextPreview);
      setIsLoading(false);
    };

    void loadPreview();
  }, [router]);

  const allConflictsResolved = useMemo(() => {
    if (preview == null) {
      return false;
    }

    return preview.conflicts.every((conflict) => {
      return resolutions[conflict.address] != null;
    });
  }, [preview, resolutions]);

  const hasChanges = useMemo(() => {
    if (preview == null) {
      return false;
    }

    const willUpdate = preview.conflicts.some((conflict) => {
      return resolutions[conflict.address] === "imported";
    });

    return preview.adds.length > 0 || willUpdate;
  }, [preview, resolutions]);

  const handleImport = useCallback(async () => {
    if (preview == null || !allConflictsResolved || !hasChanges) {
      return;
    }

    setImportError(null);
    setIsImporting(true);

    try {
      await mergeImportedAddressBookContacts({
        imported: preview.imported,
        conflicts: preview.conflicts,
        resolutions,
      });
      clearAddressBookImportDraft();
      router.replace("/contacts");
    } catch {
      setImportError(t("addressBook.importError"));
      setIsImporting(false);
    }
  }, [allConflictsResolved, hasChanges, preview, resolutions, router, t]);

  if (isLoading || preview == null) {
    return (
      <Screen header={<ScreenHeader title={t("addressBook.importPreview")} />}>
        <Text muted variant="body">
          {t("common.loading")}
        </Text>
      </Screen>
    );
  }

  return (
    <Screen
      header={
        <ScreenHeader
          onBackPress={() => {
            router.back();
          }}
          title={t("addressBook.importPreview")}
        />
      }
      scroll
    >
      <Card style={styles.summaryCard}>
        <Text variant="body">
          {t("addressBook.importNewCount", { count: preview.adds.length })}
        </Text>
        <Text variant="body">
          {t("addressBook.importConflictCount", {
            count: preview.conflicts.length,
          })}
        </Text>
        {preview.unchangedCount > 0 ? (
          <Text muted variant="body">
            {t("addressBook.importUnchangedCount", {
              count: preview.unchangedCount,
            })}
          </Text>
        ) : null}
      </Card>

      {preview.conflicts.length > 0 ? (
        <View style={styles.listSection}>
          <Text variant="caption">{t("addressBook.importConflictsTitle")}</Text>
          {preview.conflicts.map((conflict) => {
            return (
              <Card key={conflict.address} style={styles.conflictCard}>
                <Text muted selectable variant="caption">
                  {conflict.address}
                </Text>
                <View style={styles.conflictNames}>
                  <View style={styles.conflictNameBlock}>
                    <Text muted variant="caption">
                      {t("addressBook.importKeepImported")}
                    </Text>
                    <Text variant="body">{conflict.importedName}</Text>
                  </View>
                  <View style={styles.conflictNameBlock}>
                    <Text muted variant="caption">
                      {t("addressBook.importKeepCurrent")}
                    </Text>
                    <Text variant="body">{conflict.current.name}</Text>
                  </View>
                </View>
                <AddressBookImportConflictControl
                  currentLabel={t("addressBook.importKeepCurrent")}
                  importedLabel={t("addressBook.importKeepImported")}
                  onChange={(value) => {
                    setResolutions((current) => {
                      return {
                        ...current,
                        [conflict.address]: value,
                      };
                    });
                  }}
                  value={resolutions[conflict.address]}
                />
              </Card>
            );
          })}
        </View>
      ) : null}

      {!hasChanges ? (
        <Text muted style={styles.noopHint} variant="body">
          {t("addressBook.importNothingToMerge")}
        </Text>
      ) : null}

      <Button
        disabled={isImporting || !allConflictsResolved || !hasChanges}
        label={
          isImporting
            ? t("addressBook.importing")
            : t("addressBook.importConfirm")
        }
        onPress={() => {
          void handleImport();
        }}
        style={styles.importButton}
      />

      {importError != null ? (
        <Text style={{ color: colors.error }} variant="caption">
          {importError}
        </Text>
      ) : null}

      {preview.adds.length > 0 ? (
        <View style={styles.listSection}>
          <Text variant="caption">{t("addressBook.importNewListTitle")}</Text>
          <Card style={styles.listCard}>
            {preview.adds.map((entry) => {
              return (
                <View key={entry.address} style={styles.listRow}>
                  <Text variant="body">{entry.name}</Text>
                  <Text muted selectable variant="caption">
                    {entry.address}
                  </Text>
                </View>
              );
            })}
          </Card>
        </View>
      ) : null}
    </Screen>
  );
};

export default ImportContactsPreviewScreen;

const styles = StyleSheet.create({
  summaryCard: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  listSection: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  listCard: {
    gap: spacing.md,
  },
  listRow: {
    gap: spacing.xs,
  },
  conflictCard: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  conflictNames: {
    gap: spacing.sm,
  },
  conflictNameBlock: {
    gap: spacing.xs,
  },
  noopHint: {
    marginBottom: spacing.sm,
  },
  importButton: {
    marginBottom: spacing.lg,
  },
});
