import type { TranslateFn } from "@/lib/createTranslator";

export const formatActivityTimestamp = (
  timestampMs: number,
  t: TranslateFn,
): string => {
  const date = new Date(timestampMs);
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  const timeLabel = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  if (date >= startOfToday) {
    return t("activity.today", { time: timeLabel });
  }

  if (date >= startOfYesterday) {
    return t("activity.yesterday", { time: timeLabel });
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};
