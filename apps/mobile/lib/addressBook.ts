import AsyncStorage from "@react-native-async-storage/async-storage";

import { ADDRESS_BOOK_CONTACTS_KEY } from "@/lib/asyncStorageKeys";

const ADDRESS_BOOK_VERSION = 1;

export type AddressBookContact = {
  id: string;
  name: string;
  address: string;
  createdAt: string;
  updatedAt: string;
};

type AddressBookPayload = {
  version: number;
  contacts: AddressBookContact[];
};

const isAddressBookContact = (value: unknown): value is AddressBookContact => {
  if (typeof value !== "object" || value == null) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    typeof record.id === "string" &&
    record.id.length > 0 &&
    typeof record.name === "string" &&
    record.name.trim().length > 0 &&
    typeof record.address === "string" &&
    record.address.trim().length > 0 &&
    typeof record.createdAt === "string" &&
    record.createdAt.length > 0 &&
    typeof record.updatedAt === "string" &&
    record.updatedAt.length > 0
  );
};

const parseContacts = (raw: string): AddressBookContact[] => {
  try {
    const parsed: unknown = JSON.parse(raw);

    if (typeof parsed !== "object" || parsed == null) {
      return [];
    }

    const record = parsed as Record<string, unknown>;

    if (record.version !== ADDRESS_BOOK_VERSION) {
      return [];
    }

    if (!Array.isArray(record.contacts)) {
      return [];
    }

    return record.contacts.filter(isAddressBookContact).sort((a, b) => {
      return a.name.localeCompare(b.name);
    });
  } catch {
    return [];
  }
};

const writeContacts = async (contacts: AddressBookContact[]): Promise<void> => {
  const payload: AddressBookPayload = {
    version: ADDRESS_BOOK_VERSION,
    contacts,
  };

  await AsyncStorage.setItem(
    ADDRESS_BOOK_CONTACTS_KEY,
    JSON.stringify(payload),
  );
};

export const getAddressBookContacts = async (): Promise<
  AddressBookContact[]
> => {
  const raw = await AsyncStorage.getItem(ADDRESS_BOOK_CONTACTS_KEY);

  if (raw == null) {
    return [];
  }

  return parseContacts(raw);
};

type SaveAddressBookContactParams = {
  id?: string;
  name: string;
  address: string;
};

export const saveAddressBookContact = async ({
  id,
  name,
  address,
}: SaveAddressBookContactParams): Promise<AddressBookContact> => {
  const trimmedName = name.trim();
  const trimmedAddress = address.trim();

  if (trimmedName.length === 0 || trimmedAddress.length === 0) {
    throw new Error("Contact name and address are required.");
  }

  const existing = await getAddressBookContacts();
  const existingContact =
    id == null
      ? existing.find((contact) => {
          return contact.address === trimmedAddress;
        })
      : existing.find((contact) => {
          return contact.id === id;
        });
  const now = new Date().toISOString();

  const nextContact: AddressBookContact =
    existingContact == null
      ? {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
          name: trimmedName,
          address: trimmedAddress,
          createdAt: now,
          updatedAt: now,
        }
      : {
          ...existingContact,
          name: trimmedName,
          address: trimmedAddress,
          updatedAt: now,
        };

  const nextContacts = existing
    .filter((contact) => {
      if (existingContact == null) {
        return contact.address !== trimmedAddress;
      }

      return (
        contact.id !== existingContact.id && contact.address !== trimmedAddress
      );
    })
    .concat(nextContact)
    .sort((a, b) => {
      return a.name.localeCompare(b.name);
    });

  await writeContacts(nextContacts);

  return nextContact;
};

export const getAddressBookContact = async (
  id: string,
): Promise<AddressBookContact | null> => {
  const contacts = await getAddressBookContacts();
  const contact = contacts.find((item) => {
    return item.id === id;
  });

  return contact ?? null;
};

export const deleteAddressBookContact = async (id: string): Promise<void> => {
  const contacts = await getAddressBookContacts();
  const nextContacts = contacts.filter((contact) => {
    return contact.id !== id;
  });

  await writeContacts(nextContacts);
};

export const replaceAddressBookContacts = async (
  contacts: AddressBookContact[],
): Promise<void> => {
  await writeContacts(contacts);
};

export const buildAddressBookExportJson = (
  contacts: AddressBookContact[],
): string => {
  const payload: AddressBookPayload = {
    version: ADDRESS_BOOK_VERSION,
    contacts,
  };

  return JSON.stringify(payload, null, 2);
};

export const clearAddressBookContacts = async (): Promise<void> => {
  await AsyncStorage.removeItem(ADDRESS_BOOK_CONTACTS_KEY);
};
