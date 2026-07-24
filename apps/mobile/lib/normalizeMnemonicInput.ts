export const normalizeMnemonicInput = (input: string): string => {
  return input.trim().toLowerCase().replace(/\s+/g, " ");
};
