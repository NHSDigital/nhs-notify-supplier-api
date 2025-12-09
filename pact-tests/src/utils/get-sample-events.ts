/* eslint-disable security/detect-non-literal-fs-filename */
import path from "node:path";
import { readdirSync } from "node:fs";

export const getSampleEvent = (eventType: string, version = "v2.0.1") => {
  const basePath = path.join(
    __dirname,
    "../../node_modules/@nhsdigital/nhs-notify-event-schemas-letter-rendering/examples",
    eventType,
    version,
  );

  const fileNames = readdirSync(basePath);

  if (fileNames.length === 0) {
    throw new Error(`Could not find sample ${eventType} events`);
  }

  return path.join(basePath, fileNames[0]);
};
