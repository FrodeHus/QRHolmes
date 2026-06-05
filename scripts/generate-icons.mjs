import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';

const source = 'QR-Holmes.png';
const outputDir = 'public/icons';

await mkdir(outputDir, { recursive: true });

async function squareIcon(size, name, padding = 0) {
  const inner = size - padding * 2;
  const image = await sharp(source)
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 20, g: 34, b: 31, alpha: 1 }
    }
  })
    .composite([{ input: image, gravity: 'center' }])
    .png()
    .toFile(`${outputDir}/${name}`);
}

await squareIcon(192, 'icon-192.png');
await squareIcon(512, 'icon-512.png');
await squareIcon(192, 'maskable-192.png', 32);
await squareIcon(512, 'maskable-512.png', 86);
