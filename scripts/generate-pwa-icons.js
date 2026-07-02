// Genera los iconos PWA (192/512/maskable/apple-touch) a partir de assets/images/icon.png.
// Correr con: node ./scripts/generate-pwa-icons.js
// Usa @expo/image-utils (ya instalado por Expo CLI); sin sharp en el proyecto, cae al path Jimp puro.
const fs = require('fs');
const path = require('path');
const {
  generateImageAsync,
  generateImageBackgroundAsync,
  compositeImagesAsync,
} = require('@expo/image-utils');

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'assets/images/icon.png');
const OUT_DIR = path.join(ROOT, 'public/icons');
const BACKGROUND_COLOR = '#09090b';

function writeIcon(name, buffer) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const outPath = path.join(OUT_DIR, name);
  fs.writeFileSync(outPath, buffer);
  console.log(`OK  public/icons/${name}`);
}

async function generateFullBleedIcon(name, size) {
  const { source } = await generateImageAsync(
    {},
    { src: SRC, width: size, height: size, resizeMode: 'contain', name }
  );
  writeIcon(name, source);
}

async function generateMaskableIcon() {
  // Safe zone de iconos maskable: el contenido debe caber en un circulo ~80% del lienzo,
  // asi el mask (circulo/squircle) del OS no recorta el logo.
  const canvasSize = 512;
  const contentSize = Math.round(canvasSize * 0.8);
  const offset = Math.round((canvasSize - contentSize) / 2);

  const { source: foreground } = await generateImageAsync(
    {},
    { src: SRC, width: contentSize, height: contentSize, resizeMode: 'contain', name: 'icon-content.png' }
  );

  const background = await generateImageBackgroundAsync({
    width: canvasSize,
    height: canvasSize,
    backgroundColor: BACKGROUND_COLOR,
  });

  const maskable = await compositeImagesAsync({ background, foreground, x: offset, y: offset });
  writeIcon('icon-maskable-512.png', maskable);
}

async function main() {
  if (!fs.existsSync(SRC)) {
    throw new Error(`No se encontro el icono fuente: ${SRC}`);
  }

  await generateFullBleedIcon('icon-192.png', 192);
  await generateFullBleedIcon('icon-512.png', 512);
  await generateFullBleedIcon('apple-touch-icon.png', 180);
  await generateMaskableIcon();

  console.log('Listo. Iconos PWA generados en public/icons/.');
}

main().catch((error) => {
  console.error('Fallo la generacion de iconos PWA:', error);
  process.exit(1);
});
