export type ActivityDirection = "received" | "sent";

export type ActivityStatus = "pending" | "confirmed" | "failed";

export type ActivityProtocol = "ark" | "lightning" | "onchain";

export type ActivityItem = {
  id: string;
  direction: ActivityDirection;
  amountSats: number;
  timestamp: number;
  status: ActivityStatus;
  protocol: ActivityProtocol;
};
