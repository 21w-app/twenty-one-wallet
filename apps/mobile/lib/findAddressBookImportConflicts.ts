import type { AddressBookContact } from "@/lib/addressBook";
import type { AddressBookImportEntry } from "@/lib/parseAddressBookImportJson";

export type AddressBookImportConflict = {
  address: string;
  importedName: string;
  current: AddressBookContact;
};

export const findAddressBookImportConflicts = (
  imported: AddressBookImportEntry[],
  existing: AddressBookContact[],
): AddressBookImportConflict[] => {
  const existingByAddress = new Map(
    existing.map((contact) => {
      return [contact.address.trim(), contact] as const;
    }),
  );

  const conflicts: AddressBookImportConflict[] = [];

  for (const entry of imported) {
    const current = existingByAddress.get(entry.address);

    if (current == null) {
      continue;
    }

    if (current.name.trim() === entry.name.trim()) {
      continue;
    }

    conflicts.push({
      address: entry.address,
      importedName: entry.name,
      current,
    });
  }

  return conflicts.sort((left, right) => {
    return left.importedName.localeCompare(right.importedName);
  });
};

export const getAddressBookImportAdds = (
  imported: AddressBookImportEntry[],
  existing: AddressBookContact[],
): AddressBookImportEntry[] => {
  const existingAddresses = new Set(
    existing.map((contact) => {
      return contact.address.trim();
    }),
  );

  return imported.filter((entry) => {
    return !existingAddresses.has(entry.address);
  });
};
