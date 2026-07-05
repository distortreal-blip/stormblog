import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const output = path.join(__dirname, '../public/og-default.jpg');

const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#050505"/>
      <stop offset="55%" stop-color="#0a0a12"/>
      <stop offset="100%" stop-color="#111827"/>
    </linearGradient>
    <linearGradient id="accent" x1="900" y1="80" x2="1120" y2="560" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#a855f7" stop-opacity="0.15"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="980" cy="320" r="220" fill="url(#accent)"/>
  <rect x="72" y="72" width="1056" height="486" rx="28" fill="none" stroke="rgba(56,189,248,0.22)" stroke-width="2"/>
  <text x="120" y="270" font-family="Arial, Helvetica, sans-serif" font-size="64" font-weight="700" fill="#fafafa">Storm Cloud Блог</text>
  <text x="120" y="340" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="#a1a1aa">VPS · DevOps · Разработка · Облако</text>
  <text x="120" y="500" font-family="Arial, Helvetica, sans-serif" font-size="24" fill="#38bdf8">blog.stormnetcloud.com</text>
</svg>`;

await sharp(Buffer.from(svg)).jpeg({ quality: 88, mozjpeg: true }).toFile(output);
console.log('Generated', output);
