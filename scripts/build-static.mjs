import { cpSync, mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = resolve(projectRoot, "dist");
const publicFiles = [
  "index.html",
  "styles.css",
  "data.js",
  "phase2-data.js",
  "app.js",
  "phase2-ui.js",
  "docs/PHASE_1_HANDOFF.md",
  "docs/CLUBHUB_DEMO_GUIDE.md",
];

rmSync(outputDirectory, { recursive: true, force: true });

for (const relativePath of publicFiles) {
  const source = resolve(projectRoot, relativePath);
  const destination = resolve(outputDirectory, relativePath);
  mkdirSync(dirname(destination), { recursive: true });
  cpSync(source, destination);
}

console.log(`Built ${publicFiles.length} static files in dist/`);
