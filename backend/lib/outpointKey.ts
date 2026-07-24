export type Outpoint = {
  txid: string;
  vout: number;
};

export const outpointKey = (outpoint: Outpoint): string => {
  return `${outpoint.txid}:${outpoint.vout}`;
};
