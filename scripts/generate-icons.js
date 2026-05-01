// Run: node scripts/generate-icons.js
// Generates VYBE-branded PNG assets using jimp (no native deps)
const path = require('path');
const Jimp = require('jimp');

const DARK   = 0x0A0A0Fff; // #0A0A0F
const PINK   = 0xFF2D78ff; // #FF2D78
const PURPLE = 0x7B2FFFff; // #7B2FFF
const WHITE  = 0xFFFFFFff;

function drawCircle(img, cx, cy, r, color) {
  const x0 = Math.max(0, cx - r);
  const y0 = Math.max(0, cy - r);
  const x1 = Math.min(img.getWidth() - 1, cx + r);
  const y1 = Math.min(img.getHeight() - 1, cy + r);
  for (let x = x0; x <= x1; x++) {
    for (let y = y0; y <= y1; y++) {
      const dx = x - cx, dy = y - cy;
      if (dx * dx + dy * dy <= r * r) img.setPixelColor(color, x, y);
    }
  }
}

function drawLine(img, x1, y1, x2, y2, thickness, color) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const steps = Math.ceil(len * 2);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const cx = Math.round(x1 + dx * t);
    const cy = Math.round(y1 + dy * t);
    drawCircle(img, cx, cy, thickness, color);
  }
}

async function makeIcon(size) {
  const img = new Jimp(size, size, DARK);
  const cx = size / 2, cy = size / 2;

  // Outer glow ring
  const ring = Math.floor(size * 0.42);
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      const dx = x - cx, dy = y - cy;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d >= ring - 4 && d <= ring) {
        const t = (x - (cx - ring)) / (ring * 2);
        const r = Math.round(255 * (1 - t) + 123 * t);
        const g = Math.round(45 * (1 - t) + 47 * t);
        const b = Math.round(120 * (1 - t) + 255 * t);
        img.setPixelColor(Jimp.rgbaToInt(r, g, b, 200), x, y);
      }
    }
  }

  // Filled circle with gradient
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      const dx = x - cx, dy = y - cy;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < ring - 4) {
        const t = d / (ring - 4);
        const r = Math.round(255 * (1 - t * 0.5) + 123 * t * 0.5);
        const g = Math.round(45 * (1 - t) + 47 * t);
        const b = Math.round(120 * (1 - t) + 255 * t);
        const alpha = Math.round(230 + 25 * (1 - t));
        img.setPixelColor(Jimp.rgbaToInt(r, g, b, alpha), x, y);
      }
    }
  }

  // Draw "V" shape in white
  const thick = Math.max(2, Math.floor(size * 0.058));
  const pad = Math.floor(size * 0.22);
  const top = Math.floor(size * 0.25);
  const bottom = Math.floor(size * 0.72);
  drawLine(img, pad, top, cx, bottom, thick, WHITE);
  drawLine(img, size - pad, top, cx, bottom, thick, WHITE);

  return img;
}

async function main() {
  console.log('Generating VYBE icons...');

  const icon = await makeIcon(1024);
  await icon.writeAsync(path.join(__dirname, '../assets/icon.png'));
  await icon.writeAsync(path.join(__dirname, '../assets/adaptive-icon.png'));
  console.log('  icon.png ✓');
  console.log('  adaptive-icon.png ✓');

  const splash = await makeIcon(512);
  await splash.writeAsync(path.join(__dirname, '../assets/splash-icon.png'));
  console.log('  splash-icon.png ✓');

  const favicon = await makeIcon(48);
  await favicon.writeAsync(path.join(__dirname, '../assets/favicon.png'));
  console.log('  favicon.png ✓');

  console.log('Done!');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
