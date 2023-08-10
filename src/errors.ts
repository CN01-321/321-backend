import { ErrorRequestHandler } from "express";
import { MongoError } from "mongodb";

export class NotFoundError extends Error {
  constructor(message?: string) {
    if (message) {
      this.message = 
    }
  }
}

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error(err);
  if (err instanceof MongoError) {
    res.sendStatus(500);
  } else if (err instanceof NotFoundError) {
  } else {
    res.sendStatus(500);
  }
};
