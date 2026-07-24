import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildOpenApiDocument } from "./buildOpenApiDocument.js";

const currentDir = dirname(fileURLToPath(import.meta.url));
const outputPath = join(currentDir, "../../openapi/openapi.json");
const document = buildOpenApiDocument();

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(document, null, 2)}\n`, "utf8");

console.log(`Wrote ${outputPath}`);
