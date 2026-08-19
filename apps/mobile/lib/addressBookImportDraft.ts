import type { AddressBookImportEntry } from "@/lib/parseAddressBookImportJson";

let draftContacts: AddressBookImportEntry[] | null = null;

export const setAddressBookImportDraft = (
  contacts: AddressBookImportEntry[],
): void => {
  draftContacts = contacts;
};

export const getAddressBookImportDraft = ():
  | AddressBookImportEntry[]
  | null => {
  return draftContacts;
};

export const clearAddressBookImportDraft = (): void => {
  draftContacts = null;
};
