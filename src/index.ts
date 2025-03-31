import express, { NextFunction, Request, Response } from "express";
import cookie from "cookie-parser";
import { prisma } from "./prisma";
import bcryptjs from "bcryptjs";
import { randomUUID } from "node:crypto";
import { redis } from "./redis";
const app = express();
import "express-async-errors";
import { errorHandler } from "./errorHandler";
import { sessionHandler } from "./sessionHandler";
app.use(express.json());
app.use(cookie("secret"));

app.get("/test-cookies", (request, response) => {
  console.log("Cookies: ", request.cookies);
  console.log("Signed Cookies: ", request.signedCookies);
  response.send("ok");
  return;
});

app.post("/user", async (request, response) => {
  const { name, email, password } = request.body;
  const data = await prisma.user.create({
    data: {
      name,
      email,
      password: bcryptjs.hashSync(password),
    },
  });
  const sessionId = randomUUID();
  const userData = {
    ...data,
    password: undefined,
  };
  const sessionKey = `session:${sessionId}`;
  await redis.hset(sessionKey, {
    ...userData,
  });
  const sevenDays = 60 * 60 * 24 * 7;
  await redis.expire(sessionKey, sevenDays);
  response.cookie("session-id", sessionId);
  response.status(201).json({
    user: userData,
    sessionId,
  });
  return;
});

app.get("/user", sessionHandler, async (request, response) => {
  const { session } = request;
  response.json(session);
  return;
});

app.post("/user/signin", sessionHandler, async (request, response) => {
  const { session } = request;
  if (session) {
    response.json(session);
    return;
  }

  const { email, password } = request.body;
  if (!email || !password) {
    response.json("Missing params!");
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    response.json(`User ${email} doesn't exist!`);
    return;
  }
  const correctPassword = await bcryptjs.compare(password, user.password);
  if (!correctPassword) {
    response.json(`Invalid credentials`);
    return;
  }
  const sessionId = randomUUID();
  const userData = {
    ...user,
    password: undefined,
  };
  const sessionKey = `session:${sessionId}`;
  await redis.hset(sessionKey, userData);
  const sevenDays = 60 * 60 * 24 * 7;
  await redis.expire(sessionKey, sevenDays);
  response.cookie("session-id", sessionId);
  response.json(userData);
});

app.delete("/user/session", async (request, response) => {
  const sessionId = request.cookies["session-id"];
  if (!sessionId) {
    response.status(204).send();
    return;
  }
  await redis.del(`session:${sessionId}`);
  response.clearCookie("session-id");
  response.status(204).send();
});

app.use(errorHandler);

const PORT = 3000;
app.listen(PORT, () => console.log(`Server started at port ${PORT}`));
