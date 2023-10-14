/**
 * @file Helper functions for error handling in controller and service files.
 * @author George Bull
 */

import { ErrorRequestHandler } from "express";
import { UpdateResult } from "mongodb";
import { ValidationError } from "yup";

export class NotFoundError extends Error {
  constructor(message?: string) {
    super(message);
  }
}

export class BadRequestError extends Error {
  constructor(message?: string) {
    super(message);
  }
}

export class UnauthorisedError extends Error {
  constructor(message?: string) {
    super(message);
  }
}
/**
 * Handles known errors that have been thrown at the controller level and return
 * their respective error codes. Otherwise, pass to express' own default error
 * handler
 */
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error(err);
  if (err instanceof NotFoundError) {
    res.status(404).send(err.message);
  } else if (err instanceof BadRequestError || err instanceof ValidationError) {
    res.status(400).send(err.message);
  } else if (err instanceof UnauthorisedError) {
    res.status(401).send(err.message);
  } else {
    next(err);
  }
};

export default errorHandler;

/**
 * Check for and throw common errors that can occur when updating mongodb
 * documents
 */
export function handleUpdateResult(updateResult: UpdateResult) {
  if (!updateResult.acknowledged) {
    throw new Error("A mongodb error occured");
  }

  if (updateResult.matchedCount === 0) {
    throw new NotFoundError();
  }

  return updateResult;
}
