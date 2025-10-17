import { writeFileSync } from "node:fs";
import bundle from "@asyncapi/bundler";
import path from "node:path";
import { version as packageVersion } from "../../package.json";

async function main() {
  const baseDir = path.resolve(process.cwd(), "..");
  const document = await bundle(
    ["events/schemas/supplier-api.yaml"],
    {
      baseDir,
      xOrigin: true,
    },
  );
  const info = document.json()?.info;
  if (info) {
    info.version = packageVersion;
  }
  const bundledOutput = document.yml();
  if (bundledOutput) {
    writeFileSync("dist/asyncapi/supplier-api.yaml", bundledOutput); // the complete bundled AsyncAPI document
  }
}

main().catch((error) => console.error(error));
