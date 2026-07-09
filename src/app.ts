import express, { type Express } from "express";
import cors from "cors";
import pinoHttpImport from "pino-http";

const pinoHttp =
  pinoHttpImport as unknown as (typeof import("pino-http")) extends {
    default: infer T;
  }
    ? T
    : typeof pinoHttpImport;
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";
import type { IncomingMessage, ServerResponse } from "http";
const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req: IncomingMessage & { id?: string }) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res: ServerResponse) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
