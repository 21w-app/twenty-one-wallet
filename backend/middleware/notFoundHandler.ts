import type { NextFunction, Request, Response } from "express";

import { HttpError } from "./errorHandler.js";

export const notFoundHandler = (
  request: Request,
  _response: Response,
  next: NextFunction,
): void => {
  next(
    new HttpError(
      404,
      `Not found: ${request.method} ${request.path}`,
      "NOT_FOUND",
    ),
  );
};
