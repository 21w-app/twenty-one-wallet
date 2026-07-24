import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

import { HttpError } from "./errorHandler.js";

type RequestPart = "body" | "params";

export const validateRequest = <T>(schema: ZodType<T>, part: RequestPart) => {
  return (request: Request, _response: Response, next: NextFunction): void => {
    const value = part === "body" ? request.body : request.params;
    const parsed = schema.safeParse(value);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      const message = firstIssue?.message ?? "Invalid request";

      next(new HttpError(400, message, "INVALID_BODY"));
      return;
    }

    if (part === "body") {
      request.body = parsed.data;
    } else {
      request.params = parsed.data as Request["params"];
    }

    next();
  };
};
