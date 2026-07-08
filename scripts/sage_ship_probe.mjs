#!/usr/bin/env node
import { access } from "node:fs/promises";
import { readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const checked = [];
const failures = [];

async function checkDistIndexHtml() {
  const path = join(root, "dist", "index.html");
  try {
    await access(path, constants.F_OK);
    checked.push("dist/index.html");
  } catch {
    failures.push("dist/index.html missing (run npm run build first)");
  }
}

async function checkPackageScripts() {
  const path = join(root, "package.json");
  let pkg;
  try {
    pkg = JSON.parse(await readFile(path, "utf8"));
  } catch {
    failures.push("package.json unreadable");
    return;
  }

  for (const name of ["build", "lint"]) {
    if (typeof pkg.scripts?.[name] === "string" && pkg.scripts[name].length > 0) {
      checked.push(`scripts.${name}`);
    } else {
      failures.push(`scripts.${name} missing in package.json`);
    }
  }
}

await checkDistIndexHtml();
await checkPackageScripts();

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, checked, errors: failures }));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, checked }));
