import { isValidArkAddress } from "@arkade-os/boltz-swap";

export type AddressBookImportEntry = {
  name: string;
  address: string;
};

type ParseFailure = {
  ok: false;
  errorKey: "addressBook.importInvalidJson" | "addressBook.importInvalidFormat";
};

type ParseSuccess = {
  ok: true;
  contacts: AddressBookImportEntry[];
};

export type AddressBookImportParseResult = ParseFailure | ParseSuccess;

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value != null;
};

const readContactsArray = (parsed: unknown): unknown[] | null => {
  if (Array.isArray(parsed)) {
    return parsed;
  }

  if (!isRecord(parsed) || !Array.isArray(parsed.contacts)) {
    return null;
  }

  return parsed.contacts;
};

const parseImportEntry = (
  value: unknown,
  index: number,
): AddressBookImportEntry | { error: string } => {
  if (!isRecord(value)) {
    return { error: `contacts[${index}]` };
  }

  const name = typeof value.name === "string" ? value.name.trim() : "";
  const address = typeof value.address === "string" ? value.address.trim() : "";

  if (name.length === 0 || address.length === 0) {
    return { error: `contacts[${index}]` };
  }

  if (!isValidArkAddress(address)) {
    return { error: `contacts[${index}].address` };
  }

  return { name, address };
};

export const parseAddressBookImportJson = (
  raw: string,
): AddressBookImportParseResult => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, errorKey: "addressBook.importInvalidJson" };
  }

  const contactsArray = readContactsArray(parsed);

  if (contactsArray == null) {
    return { ok: false, errorKey: "addressBook.importInvalidFormat" };
  }

  const byAddress = new Map<string, AddressBookImportEntry>();

  for (let index = 0; index < contactsArray.length; index += 1) {
    const entry = parseImportEntry(contactsArray[index], index);

    if ("error" in entry) {
      return { ok: false, errorKey: "addressBook.importInvalidFormat" };
    }

    byAddress.set(entry.address, entry);
  }

  return {
    ok: true,
    contacts: Array.from(byAddress.values()).sort((left, right) => {
      return left.name.localeCompare(right.name);
    }),
  };
};
