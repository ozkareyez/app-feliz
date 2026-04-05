// scripts/generate-icons.js
// Ejecutar UNA vez: node scripts/generate-icons.js
// Genera los iconos PNG para la PWA en public/icons/
// Requiere: npm install canvas  (solo para este script)

const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "..", "public", "icons");
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

function drawIcon(size) {
  const c = createCanvas(size, size);
  const ctx = c.getContext("2d");

  // Fondo oscuro con radio
  const r = size * 0.22;
  ctx.fillStyle = "#0b0f1a";
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(size - r, 0);
  ctx.quadraticCurveTo(size, 0, size, r);
  ctx.lineTo(size, size - r);
  ctx.quadraticCurveTo(size, size, size - r, size);
  ctx.lineTo(r, size);
  ctx.quadraticCurveTo(0, size, 0, size - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fill();

  // Círculo accent
  const cx = size / 2,
    cy = size / 2,
    cr = size * 0.3;
  ctx.fillStyle = "#e94560";
  ctx.beginPath();
  ctx.arc(cx, cy, cr, 0, Math.PI * 2);
  ctx.fill();

  // Letra F
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${size * 0.38}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("F", cx, cy + size * 0.02);

  return c.toBuffer("image/png");
}

function drawBadge(size) {
  const c = createCanvas(size, size);
  const ctx = c.getContext("2d");

  // Badge monocromático (blanco sobre transparente — el OS lo colorea)
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.42, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#000000";
  ctx.font = `bold ${size * 0.44}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("F", size / 2, size / 2 + size * 0.02);

  return c.toBuffer("image/png");
}

// Generar iconos
[192, 512].forEach(function (s) {
  fs.writeFileSync(path.join(OUT, `icon-${s}.png`), drawIcon(s));
  console.log(`✓ icon-${s}.png`);
});

fs.writeFileSync(path.join(OUT, "badge-72.png"), drawBadge(72));
console.log("✓ badge-72.png");

console.log("\nIconos generados en public/icons/");
console.log("Ahora puedes hacer: npm run build && vercel --prod");
