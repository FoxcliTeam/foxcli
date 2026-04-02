#!/usr/bin/env node
/**
 * Finds all stub files with `export default {} as any` and rewrites them
 * with proper named exports based on what the source code actually imports.
 */
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, join, relative, resolve } from 'path';

const ROOT = '/Users/konghayao/code/ai/claude-code';

// Step 1: Find all stub files with only `export default {} as any`
const stubFiles = new Set();
const allTsFiles = execSync('find src -name "*.ts" -o -name "*.tsx"', {
  encoding: 'utf-8', cwd: ROOT
}).trim().split('\n');

for (const f of allTsFiles) {
  const fullPath = join(ROOT, f);
  const content = readFileSync(fullPath, 'utf-8').trim();
  if (content === 'export default {} as any') {
    stubFiles.add(f); // relative path like src/types/message.ts
  }
}

console.log(`Found ${stubFiles.size} stub files with 'export default {} as any'`);

// Step 2: Scan all source files for imports from these stub modules
// Map: stub file path -> { types: Set<string>, values: Set<string> }
const stubNeeds = new Map();
for (const sf of stubFiles) {
  stubNeeds.set(sf, { types: new Set(), values: new Set() });
}

// Helper: resolve an import path from a source file to a stub file
function resolveImport(srcFile, importPath) {
  // Handle src/ prefix imports
  if (importPath.startsWith('src/')) {
    const resolved = importPath.replace(/\.js$/, '.ts');
    if (stubFiles.has(resolved)) return resolved;
    return null;
  }
  // Handle relative imports
  if (importPath.startsWith('.')) {
    const srcDir = dirname(srcFile);
    const resolved = join(srcDir, importPath).replace(/\.js$/, '.ts');
    if (stubFiles.has(resolved)) return resolved;
    // Try .tsx
    const resolvedTsx = join(srcDir, importPath).replace(/\.js$/, '.tsx');
    if (stubFiles.has(resolvedTsx)) return resolvedTsx;
    return null;
  }
  return null;
}

for (const srcFile of allTsFiles) {
  if (stubFiles.has(srcFile)) continue; // skip stub files themselves

  const fullPath = join(ROOT, srcFile);
  const content = readFileSync(fullPath, 'utf-8');

  // Match: import type { A, B } from 'path'
  const typeImportRegex = /import\s+type\s+\{([^}]+)\}\s+from\s+['"](.+?)['"]/g;
  let match;
  while ((match = typeImportRegex.exec(content)) !== null) {
    const members = match[1].split(',').map(s => {
      const parts = s.trim().split(/\s+as\s+/);
      return parts[0].trim();
    }).filter(Boolean);
    const resolved = resolveImport(srcFile, match[2]);
    if (resolved && stubNeeds.has(resolved)) {
      for (const m of members) stubNeeds.get(resolved).types.add(m);
    }
  }

  // Match: import { A, B } from 'path' (NOT import type)
  const valueImportRegex = /import\s+(?!type\s)\{([^}]+)\}\s+from\s+['"](.+?)['"]/g;
  while ((match = valueImportRegex.exec(content)) !== null) {
    const rawMembers = match[1];
    const members = rawMembers.split(',').map(s => {
      // Handle `type Foo` inline type imports
      const trimmed = s.trim();
      if (trimmed.startsWith('type ')) {
        return { name: trimmed.replace(/^type\s+/, '').split(/\s+as\s+/)[0].trim(), isType: true };
      }
      return { name: trimmed.split(/\s+as\s+/)[0].trim(), isType: false };
    }).filter(m => m.name);

    const resolved = resolveImport(srcFile, match[2]);
    if (resolved && stubNeeds.has(resolved)) {
      for (const m of members) {
        if (m.isType) {
          stubNeeds.get(resolved).types.add(m.name);
        } else {
          stubNeeds.get(resolved).values.add(m.name);
        }
      }
    }
  }

  // Match: import Default from 'path'
  const defaultImportRegex = /import\s+(?!type\s)(\w+)\s+from\s+['"](.+?)['"]/g;
  while ((match = defaultImportRegex.exec(content)) !== null) {
    const name = match[1];
    if (name === 'type') continue;
    const resolved = resolveImport(srcFile, match[2]);
    if (resolved && stubNeeds.has(resolved)) {
      stubNeeds.get(resolved).values.add('__default__:' + name);
    }
  }
}

// Step 3: Rewrite stub files
let updated = 0;
for (const [stubFile, needs] of stubNeeds) {
  const fullPath = join(ROOT, stubFile);
  const lines = ['// Auto-generated stub — replace with real implementation'];

  let hasDefault = false;

  // Add type exports
  for (const t of needs.types) {
    // Don't add as type if also in values
    if (!needs.values.has(t)) {
      lines.push(`export type ${t} = any;`);
    }
  }

  // Add value exports (as const with any type)
  for (const v of needs.values) {
    if (v.startsWith('__default__:')) {
      hasDefault = true;
      continue;
    }
    // Check if it's likely a type (starts with uppercase and not a known function pattern)
    // But since it's imported without `type`, treat as value to be safe
    lines.push(`export const ${v}: any = (() => {}) as any;`);
  }

  // Add default export if needed
  if (hasDefault) {
    lines.push(`export default {} as any;`);
  }

  if (needs.types.size === 0 && needs.values.size === 0) {
    lines.push('export {};');
  }

  writeFileSync(fullPath, lines.join('\n') + '\n');
  updated++;
}

console.log(`Updated ${updated} stub files`);

// Print summary
for (const [stubFile, needs] of stubNeeds) {
  if (needs.types.size > 0 || needs.values.size > 0) {
    console.log(`  ${stubFile}: ${needs.types.size} types, ${needs.values.size} values`);
  }
}
