import { NextFunction, Request, Response } from "express";
import { redis } from "./redis";
interface UserSession {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function sessionHandler(request: Request, response: Response, next: NextFunction) {
  const sessionId = request.cookies["session-id"];
  if (!sessionId) {
    request.session = null;
    return next();
  }

  const REDIS_SESSION_KEY = `session:${sessionId}`;
  const userHasValidSession = await redis.exists(REDIS_SESSION_KEY);
  if (!userHasValidSession) {
    request.session = null;
    return next();
  }

  const userSession = await redis.hgetall(REDIS_SESSION_KEY);

  const userData: UserSession = {
    id: userSession.id,
    name: userSession.name,
    email: userSession.email,
    createdAt: new Date(userSession.createdAt),
    updatedAt: new Date(userSession.updatedAt),
  };
  request.session = userData;

  next();
}
