export type ActivityDirection = "received" | "sent";

export type ActivityStatus = "pending" | "confirmed" | "failed";

export type ActivityProtocol = "ark";

export type ActivityRamp = "fund" | "withdraw";

export type ActivityItem = {
  id: string;
  direction: ActivityDirection;
  amountSats: number;
  timestamp: number;
  status: ActivityStatus;
  protocol: ActivityProtocol;
  ramp?: ActivityRamp;
};
