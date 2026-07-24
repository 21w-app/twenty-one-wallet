export const compareSemver = (left: string, right: string): number => {
  const parsePart = (value: string, index: number): number => {
    const parts = value.split(".");
    const part = parts[index];

    if (part == null) {
      return 0;
    }

    const parsed = Number.parseInt(part, 10);

    if (!Number.isFinite(parsed)) {
      return 0;
    }

    return parsed;
  };

  const maxLength = Math.max(left.split(".").length, right.split(".").length);

  for (let index = 0; index < maxLength; index += 1) {
    const difference = parsePart(left, index) - parsePart(right, index);

    if (difference !== 0) {
      return difference;
    }
  }

  return 0;
};
