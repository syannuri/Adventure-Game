// Builds every app / bookmark icon from the square 3D render.
// 1. Put the ANET title logo on the art: open tools/icon-logo.html in a browser (Playwright) with the
//    art and the Luckiest Guy font -> docs/anet-icon-3d-logo.jpg
// 2. node tools/make-icons.mjs docs/anet-icon-3d-logo.jpg public docs/anet-icon-3d.jpg
//    (the last argument, the art without the logo, is used for the tiny tab favicons and the avatar)
// Needs `sharp`.
import sharp from 'sharp';
import path from 'path';

const [, , src, out, faceSrc] = process.argv;
const base = sharp(src).removeAlpha();
const meta = await base.metadata();
const S = Math.min(meta.width, meta.height);
const square = await base.clone().resize(S, S, { fit: 'cover' }).png().toBuffer();

const save = (buf, name, size) =>
  sharp(buf).resize(size, size, { kernel: 'lanczos3' }).png({ compressionLevel: 9, palette: true, quality: 92, dither: 0.6 }).toFile(path.join(out, name));

// iOS home screen / bookmark, Android, PWA
await save(square, 'apple-touch-icon.png', 180);
await save(square, 'icon-192.png', 192);
await save(square, 'icon-512.png', 512);

// Android adaptive (maskable): the face is centred and sits inside the 80% safe circle as is
await save(square, 'icon-maskable-512.png', 512);

// tiny browser-tab favicon: zoom in on the face (art without the logo) so it still reads at 32 px
const faceArt = faceSrc ? await sharp(faceSrc).removeAlpha().resize(S, S, { fit: 'cover' }).png().toBuffer() : square;
const crop = Math.round(S * 0.62);
const face = await sharp(faceArt).extract({ left: Math.round((S - crop) / 2), top: Math.round(S * 0.1), width: crop, height: crop }).toBuffer();
await save(face, 'favicon-32.png', 32);
await save(face, 'favicon-64.png', 64);
// in-game avatar (dialogue bubble, "Meet Anet"): head and shoulders, WebP
const av = Math.round(S * 0.8);
await sharp(faceArt)
  .extract({ left: Math.round((S - av) / 2), top: Math.round(S * 0.04), width: av, height: av })
  .resize(256, 256)
  .webp({ quality: 86 })
  .toFile(path.join(out, 'portraits', 'anet.webp'));
console.log('icons written to', out);
