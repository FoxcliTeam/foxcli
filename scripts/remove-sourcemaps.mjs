#!/usr/bin/env node
/**
 * 清除 src/ 下所有 .ts/.tsx 文件中的 //# sourceMappingURL= 行
 * 用法: node scripts/remove-sourcemaps.mjs [--dry-run]
 */
import { readdir, readFile, writeFile } from "fs/promises";
import { join, extname } from "path";

const SRC_DIR = new URL("../src", import.meta.url).pathname;
const DRY_RUN = process.argv.includes("--dry-run");
const EXTENSIONS = new Set([".ts", ".tsx"]);
const PATTERN = /^\s*\/\/# sourceMappingURL=.*$/gm;

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else if (EXTENSIONS.has(extname(entry.name))) {
      yield full;
    }
  }
}

let total = 0;
for await (const file of walk(SRC_DIR)) {
  const content = await readFile(file, "utf8");
  if (!PATTERN.test(content)) continue;
  // reset lastIndex after test
  PATTERN.lastIndex = 0;
  const cleaned = content.replace(PATTERN, "").replace(/\n{3,}/g, "\n\n");
  if (DRY_RUN) {
    console.log(`[dry-run] ${file}`);
  } else {
    await writeFile(file, cleaned, "utf8");
  }
  total++;
}

console.log(`\n${DRY_RUN ? "[dry-run] " : ""}Processed ${total} files.`);
