import { NextFunction, Request, Response } from "express";

export function errorHandler(err: Error, request: Request, response: Response, next: NextFunction) {
  console.error(err.stack);
  response.status(500).json({ err: "Whoooops! Something is wrong." });
}
