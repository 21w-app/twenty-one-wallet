import rateLimit from "express-rate-limit";

export const createIpRateLimit = ({
  windowMs,
  max,
  message,
}: {
  windowMs: number;
  max: number;
  message: string;
}) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: message,
      code: "RATE_LIMITED",
    },
  });
};
