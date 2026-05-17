import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const src = resolve(root, 'public/.well-known/assetlinks.json');
const destDir = resolve(root, 'dist/.well-known');
const dest = resolve(destDir, 'assetlinks.json');

if (existsSync(src)) {
  mkdirSync(destDir, { recursive: true });
  copyFileSync(src, dest);
  console.log('✓ assetlinks.json copied to dist/.well-known/');
} else {
  console.warn('⚠ public/.well-known/assetlinks.json not found — skipping');
}
