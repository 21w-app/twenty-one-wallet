export const truncateMiddle = (value: string, head = 10, tail = 10): string => {
  if (value.length <= head + tail + 1) {
    return value;
  }

  return `${value.slice(0, head)}…${value.slice(-tail)}`;
};
