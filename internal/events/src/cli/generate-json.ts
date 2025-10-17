import { z } from "zod";
import * as fs from "node:fs";
import { $Letter } from "../domain/letter";
import { letterEventMap } from "../events/letter-events";

for (const [key, schema] of Object.entries({
  "letter": $Letter,
})) {
  const json = z.toJSONSchema(schema, {
    io: "input",
    target: "openapi-3.0",
    reused: "ref",
  });
  fs.mkdirSync("schemas/domain", { recursive: true });
  const file = `schemas/domain/${key}.schema.json`;
  fs.writeFileSync(file, JSON.stringify(json, null, 2));
  console.info(`Wrote JSON schema for ${key} to ${file}`);
}

for (const [key, schema] of Object.entries(letterEventMap)) {
  const json = z.toJSONSchema(schema, {
    io: "input",
    target: "openapi-3.0",
    reused: "ref",
  });
  fs.mkdirSync("schemas/events", { recursive: true });
  const file = `schemas/events/${key}.schema.json`;
  fs.writeFileSync(file, JSON.stringify(json, null, 2));
  console.info(`Wrote JSON schema for ${key} to ${file}`);
}
