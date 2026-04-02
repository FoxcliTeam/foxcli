#!/usr/bin/env node
/**
 * Analyzes TypeScript errors and creates stub modules with proper named exports.
 * Run: node scripts/create-type-stubs.mjs
 */
import { execSync } from 'child_process';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';

const ROOT = '/Users/konghayao/code/ai/claude-code';

// Run tsc and capture errors (tsc exits non-zero on type errors, that's expected)
let errors;
try {
  errors = execSync('npx tsc --noEmit 2>&1', { encoding: 'utf-8', cwd: ROOT });
} catch (e) {
  errors = e.stdout || '';
}

// Map: resolved file path -> Set of needed named exports
const stubExports = new Map();
// Map: resolved file path -> Set of needed default export names
const defaultExports = new Map();

for (const line of errors.split('\n')) {
  // TS2614: Module '"X"' has no exported member 'Y'. Did you mean to use 'import Y from "X"' instead?
  let m = line.match(/error TS2614: Module '"(.+?)"' has no exported member '(.+?)'\. Did you mean to use 'import .* from/);
  if (m) {
    const [, mod, member] = m;
    if (!defaultExports.has(mod)) defaultExports.set(mod, new Set());
    defaultExports.get(mod).add(member);
    continue;
  }

  // TS2305: Module '"X"' has no exported member 'Y'
  m = line.match(/error TS2305: Module '"(.+?)"' has no exported member '(.+?)'/);
  if (m) {
    const [, mod, member] = m;
    if (!stubExports.has(mod)) stubExports.set(mod, new Set());
    stubExports.get(mod).add(member);
  }

  // TS2724: '"X"' has no exported member named 'Y'. Did you mean 'Z'?
  m = line.match(/error TS2724: '"(.+?)"' has no exported member named '(.+?)'/);
  if (m) {
    const [, mod, member] = m;
    if (!stubExports.has(mod)) stubExports.set(mod, new Set());
    stubExports.get(mod).add(member);
  }

  // TS2306: File 'X' is not a module
  m = line.match(/error TS2306: File '(.+?)' is not a module/);
  if (m) {
    const filePath = m[1];
    if (!stubExports.has(filePath)) stubExports.set(filePath, new Set());
  }

  // TS2307: Cannot find module 'X'
  m = line.match(/^(.+?)\(\d+,\d+\): error TS2307: Cannot find module '(.+?)'/);
  if (m) {
    const [srcFile, mod] = [m[1], m[2]];
    if (mod.endsWith('.md')) continue;
    if (!mod.startsWith('.') && !mod.startsWith('src/')) continue;
    // Will be resolved below
    const srcDir = dirname(srcFile);
    const resolved = join(ROOT, srcDir, mod).replace(/\.js$/, '.ts');
    if (resolved.startsWith(ROOT + '/') && !existsSync(resolved)) {
      if (!stubExports.has(resolved)) stubExports.set(resolved, new Set());
    }
  }
}

// Also parse actual import statements from source files to find what's needed
import { readFileSync } from 'fs';
const allSourceFiles = execSync('find src -name "*.ts" -o -name "*.tsx"', { encoding: 'utf-8', cwd: ROOT }).trim().split('\n');

for (const file of allSourceFiles) {
  const content = readFileSync(join(ROOT, file), 'utf-8');
  const srcDir = dirname(file);

  // Find all import { X, Y } from 'module'
  const importRegex = /import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+['"](.+?)['"]/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const members = match[1].split(',').map(s => s.trim().split(/\s+as\s+/)[0].trim()).filter(Boolean);
    let mod = match[2];
    if (!mod.startsWith('.') && !mod.startsWith('src/')) continue;
    
    const resolved = join(ROOT, srcDir, mod).replace(/\.js$/, '.ts');
    if (resolved.startsWith(ROOT + '/') && !existsSync(resolved)) {
      if (!stubExports.has(resolved)) stubExports.set(resolved, new Set());
      for (const member of members) {
        stubExports.get(resolved).add(member);
      }
    }
  }
}

// Now create/update all stub files
let created = 0;
for (const [filePath, exports] of stubExports) {
  const relPath = filePath.replace(ROOT + '/', '');
  const dir = dirname(filePath);
  
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const lines = ['// Auto-generated type stub — replace with real implementation'];
  
  for (const exp of exports) {
    lines.push(`export type ${exp} = any;`);
  }
  
  // Check if there are default exports needed
  for (const [mod, defs] of defaultExports) {
    // Match the module path
    const modNorm = mod.replace(/\.js$/, '').replace(/^src\//, '');
    const filePathNorm = relPath.replace(/\.ts$/, '');
    if (modNorm === filePathNorm || mod === relPath) {
      for (const def of defs) {
        lines.push(`export type ${def} = any;`);
      }
    }
  }
  
  // Ensure at least export {}
  if (exports.size === 0) {
    lines.push('export {};');
  }

  writeFileSync(filePath, lines.join('\n') + '\n');
  created++;
}

console.log(`Created/updated ${created} stub files`);
console.log(`Total named exports resolved: ${[...stubExports.values()].reduce((a, b) => a + b.size, 0)}`);
