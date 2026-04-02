#!/usr/bin/env node
/**
 * Fixes TS2339 "Property X does not exist on type 'typeof import(...)'"
 * by adding missing exports to the stub module files.
 * Also re-runs TS2305/TS2724 fixes.
 */
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';

const ROOT = '/Users/konghayao/code/ai/claude-code';

// Run tsc and capture errors
let errors;
try {
  errors = execSync('npx tsc --noEmit 2>&1', { encoding: 'utf-8', cwd: ROOT, maxBuffer: 50 * 1024 * 1024 });
} catch (e) {
  errors = e.stdout || '';
}

// ============================================================
// 1. Fix TS2339 on typeof import(...) - add missing exports
// ============================================================
// Map: module file path -> Set<property name>
const missingExports = new Map();

for (const line of errors.split('\n')) {
  // TS2339: Property 'X' does not exist on type 'typeof import("path")'
  let m = line.match(/error TS2339: Property '(\w+)' does not exist on type 'typeof import\("(.+?)"\)'/);
  if (m) {
    const [, prop, modPath] = m;
    let filePath;
    if (modPath.startsWith('/')) {
      filePath = modPath;
    } else {
      continue; // skip non-absolute paths for now
    }
    // Try .ts then .tsx
    for (const ext of ['.ts', '.tsx']) {
      const fp = filePath + ext;
      if (existsSync(fp)) {
        if (!missingExports.has(fp)) missingExports.set(fp, new Set());
        missingExports.get(fp).add(prop);
        break;
      }
    }
  }

  // TS2339 on type '{ default: typeof import("...") }' (namespace import)
  m = line.match(/error TS2339: Property '(\w+)' does not exist on type '\{ default: typeof import\("(.+?)"\)/);
  if (m) {
    const [, prop, modPath] = m;
    for (const ext of ['.ts', '.tsx']) {
      const fp = (modPath.startsWith('/') ? modPath : join(ROOT, modPath)) + ext;
      if (existsSync(fp)) {
        if (!missingExports.has(fp)) missingExports.set(fp, new Set());
        missingExports.get(fp).add(prop);
        break;
      }
    }
  }
}

console.log(`Found ${missingExports.size} modules needing export additions for TS2339`);

let ts2339Fixed = 0;
for (const [filePath, props] of missingExports) {
  const content = readFileSync(filePath, 'utf-8');
  const existingExports = new Set();
  // Parse existing exports
  const exportRegex = /export\s+(?:type|const|function|class|let|var|default)\s+(\w+)/g;
  let em;
  while ((em = exportRegex.exec(content)) !== null) {
    existingExports.add(em[1]);
  }

  const newExports = [];
  for (const prop of props) {
    if (!existingExports.has(prop) && !content.includes(`export { ${prop}`) && !content.includes(`, ${prop}`)) {
      newExports.push(`export const ${prop}: any = (() => {}) as any;`);
      ts2339Fixed++;
    }
  }

  if (newExports.length > 0) {
    const newContent = content.trimEnd() + '\n' + newExports.join('\n') + '\n';
    writeFileSync(filePath, newContent);
  }
}
console.log(`Added ${ts2339Fixed} missing exports for TS2339`);

// ============================================================
// 2. Fix TS2305 - Module has no exported member
// ============================================================
const ts2305Fixes = new Map();

for (const line of errors.split('\n')) {
  let m = line.match(/^(.+?)\(\d+,\d+\): error TS2305: Module '"(.+?)"' has no exported member '(.+?)'/);
  if (!m) continue;
  const [, srcFile, mod, member] = m;

  // Resolve module path
  let resolvedPath;
  if (mod.startsWith('.') || mod.startsWith('src/')) {
    const base = mod.startsWith('.') ? join(dirname(srcFile), mod) : mod;
    const resolved = join(ROOT, base).replace(/\.js$/, '');
    for (const ext of ['.ts', '.tsx']) {
      if (existsSync(resolved + ext)) {
        resolvedPath = resolved + ext;
        break;
      }
    }
  }

  if (resolvedPath) {
    if (!ts2305Fixes.has(resolvedPath)) ts2305Fixes.set(resolvedPath, new Set());
    ts2305Fixes.get(resolvedPath).add(member);
  }
}

let ts2305Fixed = 0;
for (const [filePath, members] of ts2305Fixes) {
  const content = readFileSync(filePath, 'utf-8');
  const newExports = [];

  for (const member of members) {
    if (!content.includes(`export type ${member}`) && !content.includes(`export const ${member}`) && !content.includes(`export function ${member}`)) {
      newExports.push(`export type ${member} = any;`);
      ts2305Fixed++;
    }
  }

  if (newExports.length > 0) {
    writeFileSync(filePath, content.trimEnd() + '\n' + newExports.join('\n') + '\n');
  }
}
console.log(`Added ${ts2305Fixed} missing exports for TS2305`);

// ============================================================
// 3. Fix TS2724 - no exported member named X. Did you mean Y?
// ============================================================
const ts2724Fixes = new Map();

for (const line of errors.split('\n')) {
  let m = line.match(/^(.+?)\(\d+,\d+\): error TS2724: '"(.+?)"' has no exported member named '(.+?)'/);
  if (!m) continue;
  const [, srcFile, mod, member] = m;

  let resolvedPath;
  if (mod.startsWith('.') || mod.startsWith('src/')) {
    const base = mod.startsWith('.') ? join(dirname(srcFile), mod) : mod;
    const resolved = join(ROOT, base).replace(/\.js$/, '');
    for (const ext of ['.ts', '.tsx']) {
      if (existsSync(resolved + ext)) {
        resolvedPath = resolved + ext;
        break;
      }
    }
  }

  if (resolvedPath) {
    if (!ts2724Fixes.has(resolvedPath)) ts2724Fixes.set(resolvedPath, new Set());
    ts2724Fixes.get(resolvedPath).add(member);
  }
}

let ts2724Fixed = 0;
for (const [filePath, members] of ts2724Fixes) {
  const content = readFileSync(filePath, 'utf-8');
  const newExports = [];

  for (const member of members) {
    if (!content.includes(`export type ${member}`) && !content.includes(`export const ${member}`)) {
      newExports.push(`export type ${member} = any;`);
      ts2724Fixed++;
    }
  }

  if (newExports.length > 0) {
    writeFileSync(filePath, content.trimEnd() + '\n' + newExports.join('\n') + '\n');
  }
}
console.log(`Added ${ts2724Fixed} missing exports for TS2724`);

// ============================================================
// 4. Fix TS2307 - Cannot find module (create stub files)
// ============================================================
let ts2307Fixed = 0;

for (const line of errors.split('\n')) {
  let m = line.match(/^(.+?)\(\d+,\d+\): error TS2307: Cannot find module '(.+?)'/);
  if (!m) continue;
  const [, srcFile, mod] = m;
  if (mod.endsWith('.md') || mod.endsWith('.css')) continue;
  if (!mod.startsWith('.') && !mod.startsWith('src/')) continue;

  const srcDir = dirname(srcFile);
  let resolved;
  if (mod.startsWith('.')) {
    resolved = join(ROOT, srcDir, mod).replace(/\.js$/, '.ts');
  } else {
    resolved = join(ROOT, mod).replace(/\.js$/, '.ts');
  }

  if (!existsSync(resolved) && resolved.startsWith(ROOT + '/src/')) {
    const dir = dirname(resolved);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    // Collect imports from the source file for this module
    const srcContent = readFileSync(join(ROOT, srcFile), 'utf-8');
    const importRegex = new RegExp(`import\\s+(?:type\\s+)?\\{([^}]+)\\}\\s+from\\s+['"]${mod.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'g');
    const members = new Set();
    let im;
    while ((im = importRegex.exec(srcContent)) !== null) {
      im[1].split(',').map(s => s.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0].trim()).filter(Boolean).forEach(m => members.add(m));
    }

    const lines = ['// Auto-generated stub'];
    for (const member of members) {
      lines.push(`export type ${member} = any;`);
    }
    if (members.size === 0) lines.push('export {};');

    writeFileSync(resolved, lines.join('\n') + '\n');
    ts2307Fixed++;
  }
}
console.log(`Created ${ts2307Fixed} new stub files for TS2307`);
