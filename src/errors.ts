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

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error(err);
  if (err instanceof NotFoundError) {
    res.status(404).send(err.message);
  } else if (err instanceof BadRequestError || err instanceof ValidationError) {
    res.status(400).send(err.message);
  } else {
    next(err);
  }
};

export default errorHandler;

export function handleUpdateResult(updateResult: UpdateResult) {
  if (!updateResult.acknowledged) {
    throw new Error("A mongodb error occured");
  }

  if (updateResult.matchedCount === 0) {
    throw new NotFoundError();
  }

  return updateResult;
}
