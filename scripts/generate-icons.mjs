/**
 * PWA Icon Generator
 * Run: node scripts/generate-icons.mjs
 */

import sharp from 'sharp';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const svgBuffer = readFileSync(resolve(root, 'public/favicon.svg'));

const sizes = [
  { name: 'icon-72.png',           size: 72 },
  { name: 'icon-96.png',           size: 96 },
  { name: 'icon-128.png',          size: 128 },
  { name: 'icon-144.png',          size: 144 },
  { name: 'icon-152.png',          size: 152 },
  { name: 'icon-192.png',          size: 192 },
  { name: 'icon-384.png',          size: 384 },
  { name: 'icon-512.png',          size: 512 },
  { name: 'icon-512-maskable.png', size: 512 },
];

for (const { name, size } of sizes) {
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(resolve(root, 'public/icons', name));
  console.log(`✓ Generated public/icons/${name}`);
}

console.log('\nSaare icons generate ho gaye. git mein add karein aur redeploy karein.');
