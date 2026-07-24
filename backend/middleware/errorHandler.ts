import type { NextFunction, Request, Response } from "express";

import { logger } from "../lib/logger.js";

export type ApiErrorBody = {
  error: string;
  code?: string;
};

export class HttpError extends Error {
  readonly statusCode: number;
  readonly code?: string;

  constructor(statusCode: number, message: string, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export const errorHandler = (
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
): void => {
  if (error instanceof HttpError) {
    const body: ApiErrorBody = {
      error: error.message,
      code: error.code,
    };
    response.status(error.statusCode).json(body);
    return;
  }

  logger.error({ err: error }, "Unhandled request error");

  const body: ApiErrorBody = {
    error: "Internal server error",
    code: "INTERNAL_ERROR",
  };
  response.status(500).json(body);
};
