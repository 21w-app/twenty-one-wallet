import { prisma } from "../lib/prisma.js";

export type HealthStatus = {
  status: "ok" | "degraded";
  timestamp: string;
  database: "up" | "down";
};

export const getHealthStatus = async (): Promise<HealthStatus> => {
  const timestamp = new Date().toISOString();

  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: "ok",
      timestamp,
      database: "up",
    };
  } catch {
    return {
      status: "degraded",
      timestamp,
      database: "down",
    };
  }
};
