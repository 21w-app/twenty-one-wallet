import type { Env } from "../lib/env.js";

export type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
};

type ExpoPushTicket = {
  status: "ok" | "error";
  message?: string;
  details?: { error?: string };
};

export const sendExpoPush = async (
  env: Env,
  messages: ExpoPushMessage[],
): Promise<void> => {
  if (messages.length === 0) {
    return;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (env.expoAccessToken != null) {
    headers.Authorization = `Bearer ${env.expoAccessToken}`;
  }

  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers,
    body: JSON.stringify(messages),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Expo push failed (${response.status}): ${text}`);
  }

  const payload = (await response.json()) as { data?: ExpoPushTicket[] };
  const tickets = payload.data ?? [];

  for (const ticket of tickets) {
    if (ticket.status === "error") {
      console.warn(
        "Expo push ticket error:",
        ticket.message ?? ticket.details?.error,
      );
    }
  }
};
