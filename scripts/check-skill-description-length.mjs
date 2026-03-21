#!/usr/bin/env node
/**
 * Check that all SKILL.md description fields are within the character limit.
 */

import { readdirSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const MAX_LENGTH = 1200;
const __dirname = dirname(fileURLToPath(import.meta.url));
const skillsDir = join(__dirname, "..", "skills");

function extractDescription(filepath) {
  const content = readFileSync(filepath, "utf-8");
  // block scalar (| or >)
  let m = content.match(
    /description:\s*[|>]-?\s*\n(.*?)(?=\n(?:allowed-tools|user-invocable))/s
  );
  if (m) return m[1].trim();
  // quoted string
  m = content.match(/description:\s*"(.*?)"/s);
  if (m) return m[1].trim();
  return null;
}

const errors = [];

const dirs = readdirSync(skillsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .sort((a, b) => a.name.localeCompare(b.name));

for (const dir of dirs) {
  const skillMd = join(skillsDir, dir.name, "SKILL.md");
  let content;
  try {
    content = readFileSync(skillMd);
  } catch {
    continue;
  }

  const desc = extractDescription(skillMd);
  if (desc === null) {
    errors.push(`  ${dir.name}: could not parse description`);
    continue;
  }

  const length = desc.length;
  if (length > MAX_LENGTH) {
    errors.push(
      `  ${dir.name}: description is ${length} chars (limit ${MAX_LENGTH}, over by ${length - MAX_LENGTH})`
    );
  } else {
    console.log(`  ✅ ${dir.name}: ${length}/${MAX_LENGTH}`);
  }
}

if (errors.length > 0) {
  console.log("\n❌ The following skills exceed the description limit:");
  errors.forEach((e) => console.log(e));
  process.exit(1);
} else {
  console.log("\n✅ All skill descriptions are within the limit.");
}
