export const formatSats = (sats: number): string => {
  return new Intl.NumberFormat().format(sats);
};
