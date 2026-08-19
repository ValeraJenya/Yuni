// One-off generator for the placeholder portrait PNGs committed under
// prisma/seed/assets/photos/. Not part of the seed runtime — the seed script
// only copies the already-generated files. Re-run manually with
// `node prisma/seed/assets/generate-photos.mjs` if the persona list changes.
import { deflateSync, crc32 } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, 'photos');

const WIDTH = 480;
const HEIGHT = 640;

const PERSONAS = [
  { key: 'demo', bg: [216, 92, 108] },
  { key: 'anna', bg: [58, 168, 158] },
  { key: 'igor', bg: [66, 104, 196] },
  { key: 'sonya', bg: [224, 146, 60] },
  { key: 'dima', bg: [86, 158, 92] },
  { key: 'liza', bg: [150, 102, 188] },
  { key: 'mark', bg: [198, 176, 58] },
  { key: 'nastya', bg: [58, 152, 190] },
  { key: 'oleg', bg: [176, 92, 74] },
];

function lighten([r, g, b], amount) {
  return [r, g, b].map((c) => Math.round(c + (255 - c) * amount));
}

function darken([r, g, b], amount) {
  return [r, g, b].map((c) => Math.round(c * (1 - amount)));
}

function renderPersonaPixels(bg) {
  const head = lighten(bg, 0.32);
  const body = darken(bg, 0.18);
  const pixels = Buffer.alloc(WIDTH * HEIGHT * 3);

  const headCenterX = WIDTH / 2;
  const headCenterY = HEIGHT * 0.34;
  const headRadius = WIDTH * 0.27;

  const bodyCenterX = WIDTH / 2;
  const bodyCenterY = HEIGHT * 1.05;
  const bodyRadiusX = WIDTH * 0.62;
  const bodyRadiusY = HEIGHT * 0.5;

  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const dxHead = x - headCenterX;
      const dyHead = y - headCenterY;
      const inHead = dxHead * dxHead + dyHead * dyHead <= headRadius * headRadius;

      const dxBody = (x - bodyCenterX) / bodyRadiusX;
      const dyBody = (y - bodyCenterY) / bodyRadiusY;
      const inBody = dxBody * dxBody + dyBody * dyBody <= 1;

      let color = bg;
      if (inBody) color = body;
      if (inHead) color = head;

      const offset = (y * WIDTH + x) * 3;
      pixels[offset] = color[0];
      pixels[offset + 1] = color[1];
      pixels[offset + 2] = color[2];
    }
  }

  return pixels;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lengthBuf = Buffer.alloc(4);
  lengthBuf.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput) >>> 0, 0);
  return Buffer.concat([lengthBuf, typeBuf, data, crcBuf]);
}

function encodePng(pixels, width, height) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // color type: RGB
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = chunk('IHDR', ihdrData);

  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (width * 3 + 1);
    raw[rowStart] = 0; // no filter
    pixels.copy(raw, rowStart + 1, y * width * 3, (y + 1) * width * 3);
  }
  const idat = chunk('IDAT', deflateSync(raw, { level: 9 }));

  const iend = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

for (const persona of PERSONAS) {
  const pixels = renderPersonaPixels(persona.bg);
  const png = encodePng(pixels, WIDTH, HEIGHT);
  writeFileSync(join(OUT_DIR, `${persona.key}.png`), png);
  console.log(`wrote ${persona.key}.png (${png.length} bytes)`);
}
