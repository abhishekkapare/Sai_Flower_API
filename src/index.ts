import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { logger } from "./lib/logger";

console.log("PORT:", process.env.PORT);
console.log("Cloudinary:", process.env.CLOUDINARY_CLOUD_NAME);

const rawPort = process.env.PORT;

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});