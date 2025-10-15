import { z } from "zod";
import * as fs from "node:fs";
import { $LetterStatusChange } from "../domain/letter-status-change";
import { letterStatusChangeEventsMap } from "../events/letter-status-change-events";

for (const [key, schema] of Object.entries({
  "letter-status-change": $LetterStatusChange,
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

for (const [key, schema] of Object.entries(letterStatusChangeEventsMap)) {
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
