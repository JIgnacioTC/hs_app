const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "../public/icons");
fs.mkdirSync(dir, { recursive: true });

function createPng(size) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#000"/>
  <rect x="${size * 0.1}" y="${size * 0.1}" width="${size * 0.8}" height="${size * 0.8}" rx="${size * 0.15}" fill="none" stroke="#00A3FF" stroke-width="${size * 0.04}"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-weight="bold" font-size="${size * 0.32}" fill="#00A3FF">HS</text>
</svg>`;
  return svg;
}

[192, 512].forEach((size) => {
  fs.writeFileSync(path.join(dir, `icon-${size}.svg`), createPng(size));
});

console.log("SVG icons created. For PNG, open icons in browser or use sharp.");
