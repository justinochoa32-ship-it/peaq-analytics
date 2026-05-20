import { cp, mkdir, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const siteRoot = join(scriptDir, '..');
const outputDir = join(siteRoot, 'dist');

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

for (const entry of ['index.html', 'styles.css', 'assets']) {
  await cp(join(siteRoot, entry), join(outputDir, entry), { recursive: true });
}

console.log('Marketing site built to dist/.');
