import {
  getAddressBookContacts,
  replaceAddressBookContacts,
  type AddressBookContact,
} from "@/lib/addressBook";
import type { AddressBookImportConflict } from "@/lib/findAddressBookImportConflicts";
import type { AddressBookImportEntry } from "@/lib/parseAddressBookImportJson";

export type AddressBookConflictResolution = "imported" | "current";

type MergeImportedAddressBookContactsParams = {
  imported: AddressBookImportEntry[];
  conflicts: AddressBookImportConflict[];
  resolutions: Record<string, AddressBookConflictResolution>;
};

type MergeImportedAddressBookContactsResult = {
  addedCount: number;
  updatedCount: number;
  unchangedCount: number;
};

const createImportedContact = (
  entry: AddressBookImportEntry,
): AddressBookContact => {
  const now = new Date().toISOString();

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    name: entry.name.trim(),
    address: entry.address.trim(),
    createdAt: now,
    updatedAt: now,
  };
};

export const mergeImportedAddressBookContacts = async ({
  imported,
  conflicts,
  resolutions,
}: MergeImportedAddressBookContactsParams): Promise<MergeImportedAddressBookContactsResult> => {
  const existing = await getAddressBookContacts();
  const conflictAddresses = new Set(
    conflicts.map((conflict) => {
      return conflict.address;
    }),
  );
  const existingByAddress = new Map(
    existing.map((contact) => {
      return [contact.address.trim(), contact] as const;
    }),
  );

  let addedCount = 0;
  let updatedCount = 0;
  let unchangedCount = 0;

  for (const entry of imported) {
    const address = entry.address.trim();
    const current = existingByAddress.get(address);
    const resolution = resolutions[address];

    if (current == null) {
      existingByAddress.set(address, createImportedContact(entry));
      addedCount += 1;
      continue;
    }

    if (!conflictAddresses.has(address)) {
      unchangedCount += 1;
      continue;
    }

    if (resolution === "imported") {
      const now = new Date().toISOString();
      existingByAddress.set(address, {
        ...current,
        name: entry.name.trim(),
        updatedAt: now,
      });
      updatedCount += 1;
      continue;
    }

    unchangedCount += 1;
  }

  const nextContacts = Array.from(existingByAddress.values()).sort(
    (left, right) => {
      return left.name.localeCompare(right.name);
    },
  );

  await replaceAddressBookContacts(nextContacts);

  return { addedCount, updatedCount, unchangedCount };
};
