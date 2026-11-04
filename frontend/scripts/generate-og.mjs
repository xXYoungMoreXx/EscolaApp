/* Gera o og-image.png compartilhável a partir do SVG abaixo.
   Rode uma vez: node scripts/generate-og.mjs  (dependência: sharp — devDep) */
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(here, '..', 'public', 'og-image.png');

const W = 1200;
const H = 630;

const chips = ['Alunos', 'Turmas', 'Notas', 'Presença', 'Avisos'];
const chipXs = [];
let cursor = 0;
const chipWidth = (t) => t.length * 15 + 44;
{ let total = chips.reduce((a, t) => a + chipWidth(t), 0) + (chips.length - 1) * 16;
  cursor = (W - total) / 2;
}
const chipEls = chips
  .map((t) => {
    const w = chipWidth(t);
    const x = cursor;
    cursor += w + 16;
    return `<rect x="${x}" y="${H - 118}" width="${w}" height="52" rx="26" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="2"/>
      <text x="${x + w / 2}" y="${H - 84}" font-family="Segoe UI, Arial" font-size="24" fill="#dbeafe" text-anchor="middle">${t}</text>`;
  })
  .join('');

const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1e3a8a"/>
      <stop offset="1" stop-color="#2563eb"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect x="${W / 2 - 42}" y="128" width="84" height="84" rx="20" fill="#ffffff"/>
  <text x="${W / 2}" y="188" font-family="Segoe UI, Arial" font-size="46" font-weight="700" fill="#1d4ed8" text-anchor="middle">EA</text>
  <text x="${W / 2}" y="300" font-family="Segoe UI, Arial" font-size="78" font-weight="700" fill="#ffffff" text-anchor="middle">EscolaApp</text>
  <text x="${W / 2}" y="368" font-family="Segoe UI, Arial" font-size="36" fill="#bfdbfe" text-anchor="middle">Gestão escolar sem papelada</text>
  ${chipEls}
</svg>`;

mkdirSync(path.dirname(out), { recursive: true });
await sharp(Buffer.from(svg)).png().toFile(out);
console.log('OG image gerada em', out);
