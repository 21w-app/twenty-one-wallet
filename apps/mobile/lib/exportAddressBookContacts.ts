import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Share } from "react-native";

import {
  buildAddressBookExportJson,
  getAddressBookContacts,
} from "@/lib/addressBook";

export const exportAddressBookContacts = async (
  dialogTitle: string,
): Promise<void> => {
  const savedContacts = await getAddressBookContacts();
  const json = buildAddressBookExportJson(savedContacts);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `21w-address-book-${timestamp}.json`;
  const file = new File(Paths.cache, filename);

  if (await Sharing.isAvailableAsync()) {
    file.write(json);
    await Sharing.shareAsync(file.uri, {
      mimeType: "application/json",
      dialogTitle,
      UTI: "public.json",
    });
    return;
  }

  await Share.share({ message: json });
};
