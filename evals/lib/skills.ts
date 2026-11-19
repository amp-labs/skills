import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const skillsRoot = fileURLToPath(new URL('../../skills/', import.meta.url));

// Files that install the named skills as project skills in the sandbox workspace, under `targetDir`.
export function skillFiles(names: string[], targetDir: string): Record<string, string> {
  const files: Record<string, string> = {};
  for (const name of names) {
    const dir = join(skillsRoot, name);
    for (const path of walk(dir)) {
      files[join(targetDir, name, relative(dir, path))] = readFileSync(path, 'utf-8');
    }
  }
  return files;
}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}
