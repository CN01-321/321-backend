import { Response } from "express";
import { MongoError } from "mongodb";

// handles errors produced by controllers, will handle sending errors and accepts
// and optional error code that will default to 500 (internal server error)
export function handleControllerError(
  res: Response,
  err: unknown,
  expectedErrorCode?: number
) {
  console.error(err);
  if (err instanceof MongoError) {
    res.sendStatus(500);
  } else if (err instanceof Error) {
    res.status(expectedErrorCode ?? 500).send(err.message);
  } else {
    res.sendStatus(500);
  }
}
