import * as SQLite from "expo-sqlite";

import { ARK_DATABASE_NAME } from "@/lib/arkConfig";
import { closeWalletDatabaseConnection } from "@/lib/createSQLiteExecutor";

const isDatabaseAlreadyAbsentError = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }

  // expo-sqlite throws DatabaseNotFoundException when the file is already gone.
  return error.message.includes("not found");
};

export const deleteWalletDatabase = async (): Promise<void> => {
  closeWalletDatabaseConnection();

  try {
    await SQLite.deleteDatabaseAsync(ARK_DATABASE_NAME);
  } catch (error) {
    if (isDatabaseAlreadyAbsentError(error)) {
      return;
    }

    throw error;
  }
};
