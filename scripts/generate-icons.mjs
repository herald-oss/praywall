// Regenerates the PWA / Apple icons from one SVG (a warm candle flame on the
// site's dark background). Run: node scripts/generate-icons.mjs
import sharp from "sharp";

const svg = (pad) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="${pad ? 0 : 112}" fill="#151517"/>
  <g transform="translate(256 262) scale(${pad ? 0.78 : 1})">
    <path d="M0-170 C 70 -90 118 -30 118 48 C 118 118 64 168 0 168 C -64 168 -118 118 -118 48 C -118 -30 -70 -90 0 -170 Z" fill="#da814e"/>
    <path d="M0 -40 C 34 0 56 30 56 68 C 56 104 30 128 0 128 C -30 128 -56 104 -56 68 C -56 30 -34 0 0 -40 Z" fill="#f5c9a8"/>
  </g>
</svg>`;

const targets = [
  ["public/icons/icon-192.png", 192, false],
  ["public/icons/icon-512.png", 512, false],
  ["public/icons/icon-maskable-512.png", 512, true],
  ["public/icons/apple-touch-icon.png", 180, true],
];

for (const [file, size, maskable] of targets) {
  await sharp(Buffer.from(svg(maskable))).resize(size, size).png().toFile(file);
  console.log("wrote", file);
}
