import { Prisma } from "@prisma/client";

import { prisma } from "../lib/prisma.js";
import { parseFundsCursor, serializeFundsCursor } from "./fetchIndexerVtxos.js";

type CursorRow = {
  last_funds_cursor: string | null;
};

type MergeFundsCursorInput = {
  vtxoScriptHex: string;
  merge: (keys: Set<string>) => Set<string> | void;
  now?: Date;
};

const readLockedCursor = async (
  tx: Prisma.TransactionClient,
  vtxoScriptHex: string,
): Promise<string | null> => {
  const rows = await tx.$queryRaw<CursorRow[]>`
    SELECT last_funds_cursor
    FROM "ArkWallet"
    WHERE vtxo_script_hex = ${vtxoScriptHex}
    FOR UPDATE
  `;

  if (rows.length === 0) {
    throw new Error("Wallet not registered");
  }

  return rows[0].last_funds_cursor;
};

export const mergeFundsCursor = async ({
  vtxoScriptHex,
  merge,
  now = new Date(),
}: MergeFundsCursorInput): Promise<Set<string>> => {
  return prisma.$transaction(async (tx) => {
    const cursor = await readLockedCursor(tx, vtxoScriptHex);
    const keys = parseFundsCursor(cursor);
    const nextKeys = merge(keys) ?? keys;

    await tx.arkWallet.update({
      where: { vtxo_script_hex: vtxoScriptHex },
      data: {
        last_funds_cursor: serializeFundsCursor(nextKeys),
        last_polled_at: now,
      },
    });

    return nextKeys;
  });
};
