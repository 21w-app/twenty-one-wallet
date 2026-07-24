import { getAddressBookContacts } from "@/lib/addressBook";
import {
  findAddressBookImportConflicts,
  getAddressBookImportAdds,
  type AddressBookImportConflict,
} from "@/lib/findAddressBookImportConflicts";
import type { AddressBookImportEntry } from "@/lib/parseAddressBookImportJson";

export type AddressBookImportPreview = {
  imported: AddressBookImportEntry[];
  adds: AddressBookImportEntry[];
  conflicts: AddressBookImportConflict[];
  unchangedCount: number;
};

const countUnchangedImports = (
  imported: AddressBookImportEntry[],
  existing: Awaited<ReturnType<typeof getAddressBookContacts>>,
): number => {
  const existingByAddress = new Map(
    existing.map((contact) => {
      return [contact.address.trim(), contact] as const;
    }),
  );

  return imported.filter((entry) => {
    const current = existingByAddress.get(entry.address.trim());

    return current != null && current.name.trim() === entry.name.trim();
  }).length;
};

export const buildAddressBookImportPreview = async (
  imported: AddressBookImportEntry[],
): Promise<AddressBookImportPreview> => {
  const existing = await getAddressBookContacts();
  const conflicts = findAddressBookImportConflicts(imported, existing);
  const adds = getAddressBookImportAdds(imported, existing);
  const unchangedCount = countUnchangedImports(imported, existing);

  return {
    imported,
    adds,
    conflicts,
    unchangedCount,
  };
};
