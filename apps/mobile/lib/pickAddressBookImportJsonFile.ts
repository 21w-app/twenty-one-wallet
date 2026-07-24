import { File } from "expo-file-system";
import * as DocumentPicker from "expo-document-picker";

type PickAddressBookImportJsonFileResult =
  | { ok: true; contents: string }
  | { ok: false; cancelled: true }
  | { ok: false; cancelled: false };

export const pickAddressBookImportJsonFile =
  async (): Promise<PickAddressBookImportJsonFileResult> => {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
      type: "application/json",
    });

    if (result.canceled || result.assets.length === 0) {
      return { ok: false, cancelled: true };
    }

    const asset = result.assets[0];

    if (asset.uri.length === 0) {
      return { ok: false, cancelled: false };
    }

    try {
      const file = new File(asset.uri);
      const contents = await file.text();

      return { ok: true, contents };
    } catch {
      return { ok: false, cancelled: false };
    }
  };
