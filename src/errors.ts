import { ErrorRequestHandler } from "express";
import { MongoError } from "mongodb";

export class NotFoundError extends Error {
  constructor(message?: string) {
    super(message);
  }
}

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error(err);
  if (err instanceof MongoError) {
    res.sendStatus(500);
  } else if (err instanceof NotFoundError) {
    res.status(404).send(err.message);
  } else {
    next(err);
  }
};

export default errorHandler;
