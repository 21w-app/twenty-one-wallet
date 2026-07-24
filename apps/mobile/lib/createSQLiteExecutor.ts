import {
  SQLiteContractRepository,
  SQLiteWalletRepository,
  type SQLExecutor,
} from "@arkade-os/sdk/repositories/sqlite";
import * as SQLite from "expo-sqlite";
import type { SQLiteBindParams } from "expo-sqlite";

import { ARK_DATABASE_NAME } from "@/lib/arkConfig";

let walletDatabase: SQLite.SQLiteDatabase | null = null;

const toBindParams = (params?: unknown[]): SQLiteBindParams => {
  return (params ?? []) as SQLiteBindParams;
};

const getWalletDatabase = (): SQLite.SQLiteDatabase => {
  if (walletDatabase == null) {
    walletDatabase = SQLite.openDatabaseSync(ARK_DATABASE_NAME);
  }

  return walletDatabase;
};

export const closeWalletDatabaseConnection = (): void => {
  if (walletDatabase == null) {
    return;
  }

  walletDatabase.closeSync();
  walletDatabase = null;
};

export const createSQLiteExecutor = (): SQLExecutor => {
  const db = getWalletDatabase();

  return {
    run: async (sql, params) => {
      await db.runAsync(sql, toBindParams(params));
    },
    get: async <T = Record<string, unknown>>(
      sql: string,
      params?: unknown[],
    ) => {
      const row = await db.getFirstAsync<T>(sql, toBindParams(params));

      if (row == null) {
        return undefined;
      }

      return row;
    },
    all: async <T = Record<string, unknown>>(
      sql: string,
      params?: unknown[],
    ) => {
      return db.getAllAsync<T>(sql, toBindParams(params));
    },
  };
};

export const createSQLiteWalletRepositories = () => {
  const executor = createSQLiteExecutor();

  return {
    walletRepository: new SQLiteWalletRepository(executor),
    contractRepository: new SQLiteContractRepository(executor),
  };
};
