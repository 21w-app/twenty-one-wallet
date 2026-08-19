import type { TranslateFn } from "@/lib/createTranslator";

export const formatActivityTimestamp = (
  timestampMs: number,
  t: TranslateFn,
): string => {
  if (!Number.isFinite(timestampMs) || timestampMs <= 0) {
    return t("activity.justNow");
  }

  const date = new Date(timestampMs);

  if (Number.isNaN(date.getTime())) {
    return t("activity.justNow");
  }

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
