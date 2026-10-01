import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { docsEnabled, env } from "./env";
import { logger } from "./shared/logger";
import { errorHandler, notFoundHandler } from "./shared/http/error-handler";
import { globalLimiter } from "./shared/security/rate-limit";
import { originCheck } from "./shared/middleware/origin-check";
import { requestContext } from "./shared/middleware/request-context";
import { authRouter } from "./features/auth/auth.routes";
import { usersRouter } from "./features/users/users.routes";
import { notesRouter } from "./features/notes/notes.routes";
import { presetsRouter } from "./features/presets/presets.routes";
import { healthRouter } from "./features/health/health.routes";
import { docsRouter } from "./shared/http/docs";

export function createApp() {
  const app = express();

  if (env.TRUST_PROXY) app.set("trust proxy", 1);
  app.disable("x-powered-by");

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: false,
        directives: {
          "default-src": ["'none'"],
          "frame-ancestors": ["'none'"],
        },
      },
      crossOriginResourcePolicy: { policy: "same-site" },
      referrerPolicy: { policy: "no-referrer" },
      hsts: env.isProduction
        ? { maxAge: 31_536_000, includeSubDomains: true, preload: true }
        : false,
    }),
  );

  // ORIGINAL (restore this once debugging is done):
  // app.use(
  //   cors({
  //     origin: env.CORS_ORIGINS,
  //     credentials: true,
  //     methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  //     allowedHeaders: ['Content-Type', 'Authorization'],
  //     maxAge: 86_400,
  //   }),
  // )

  // TEMPORARY: allow every origin. Remove before real production use.
  app.use(
    cors({
      origin: true,
      credentials: true,
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      maxAge: 86_400,
    }),
  );

  // Must come after CORS (so preflights are answered) and before every router.
  // app.use(originCheck);

  app.use(express.json({ limit: "256kb" }));
  app.use(express.urlencoded({ extended: false, limit: "256kb" }));
  app.use(cookieParser());
  app.use(requestContext);

  app.use(
    pinoHttp({
      logger,
      genReqId: (_req, res) => res.locals.requestId as string,
      autoLogging: {
        ignore: (req) => req.url?.startsWith("/api/health") ?? false,
      },
      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return "error";
        if (res.statusCode >= 400) return "warn";
        return "info";
      },
    }),
  );

  app.use("/api", globalLimiter);

  app.use("/api/health", healthRouter);
  if (docsEnabled) app.use("/api/docs", docsRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/notes", notesRouter);
  app.use("/api/presets", presetsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
