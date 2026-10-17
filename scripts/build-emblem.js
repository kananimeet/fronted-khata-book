const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

async function buildEmblem() {
  const fullImgPath = path.join(__dirname, "../public/images/bachelors-book-full.png");
  if (!fs.existsSync(fullImgPath)) {
    console.error("Source image not found:", fullImgPath);
    return;
  }

  // 1. Crop the core illustration emblem cleanly (x=315..750, y=45..415)
  // Dimensions of full image: 1024x682
  const emblemBuffer = await sharp(fullImgPath)
    .extract({ left: 310, top: 40, width: 440, height: 380 })
    .toBuffer();

  await sharp(emblemBuffer)
    .png()
    .toFile(path.join(__dirname, "../public/images/emblem-raw.png"));

  // 2. Remove the light background: make background transparent
  // In the image, pixels with R > 225, G > 240, B > 230 are background mint-white
  const rawImage = await sharp(emblemBuffer).raw().toBuffer({ resolveWithObject: true });
  const { data, info } = rawImage;
  const { width, height, channels } = info;

  for (let i = 0; i < data.length; i += channels) {
    const pixelIndex = i / channels;
    const row = Math.floor(pixelIndex / width);
    const col = pixelIndex % width;

    // Cut off any stray letter tips below the swoosh curve
    if (row >= 342) {
      data[i + 3] = 0;
      continue;
    }

    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Background gradient check: minty white / pale greenish cyan
    // e.g. #f0faf6: r~240, g~250, b~246
    if (r >= 220 && g >= 235 && b >= 220) {
      data[i + 3] = 0; // Transparent
    } else if (r >= 205 && g >= 225 && b >= 205 && (g > r && g > b)) {
      // Soft edge anti-aliasing
      const alpha = Math.max(0, 255 - Math.round(((r + g + b) / 3 - 205) * 8));
      if (alpha < data[i + 3]) {
        data[i + 3] = alpha;
      }
    }
  }

  const transparentEmblem = await sharp(data, {
    raw: { width, height, channels }
  })
    .png()
    .toBuffer();

  await sharp(transparentEmblem).toFile(path.join(__dirname, "../public/images/emblem-transparent.png"));

  // 3. Create a 512x512 app icon with elegant rounded squircle
  const squircleSvg = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="sqBg" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="45%" stop-color="#f8fafc" />
      <stop offset="100%" stop-color="#ecfdf5" />
    </linearGradient>
    <linearGradient id="sqBorder" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#10b981" stop-opacity="0.5" />
      <stop offset="100%" stop-color="#059669" stop-opacity="0.8" />
    </linearGradient>
    <filter id="sqGlow" x="0" y="0" width="512" height="512" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#059669" flood-opacity="0.18" />
    </filter>
  </defs>

  <rect x="24" y="24" width="464" height="464" rx="116" fill="url(#sqBg)" filter="url(#sqGlow)" />
  <rect x="24" y="24" width="464" height="464" rx="116" stroke="url(#sqBorder)" stroke-width="4" />
</svg>`;

  const resizedEmblem = await sharp(transparentEmblem)
    .resize(380, 328, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const finalAppIcon = await sharp(Buffer.from(squircleSvg))
    .composite([
      {
        input: resizedEmblem,
        top: 92,
        left: 66,
      },
    ])
    .png()
    .toBuffer();

  // Save to icons directory
  const publicIconsDir = path.join(__dirname, "../public/icons");
  const publicDir = path.join(__dirname, "../public");

  // logo.png (512x512)
  await sharp(finalAppIcon).resize(512, 512).png().toFile(path.join(publicIconsDir, "logo.png"));

  // Also convert to logo.svg using base64 embed for SVG consumers
  const base64Png = finalAppIcon.toString("base64");
  const logoSvg = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <image width="512" height="512" xlink:href="data:image/png;base64,${base64Png}" />
</svg>`;
  fs.writeFileSync(path.join(publicIconsDir, "logo.svg"), logoSvg);
  fs.writeFileSync(path.join(publicIconsDir, "icon.svg"), logoSvg);

  // icon-512x512
  await sharp(finalAppIcon).resize(512, 512).png().toFile(path.join(publicIconsDir, "icon-512x512.png"));
  await sharp(finalAppIcon).resize(512, 512).png().toFile(path.join(publicIconsDir, "icon-maskable-512x512.png"));

  // icon-192x192
  await sharp(finalAppIcon).resize(192, 192).png().toFile(path.join(publicIconsDir, "icon-192x192.png"));
  await sharp(finalAppIcon).resize(192, 192).png().toFile(path.join(publicDir, "icon-192x192.png"));

  // apple-touch-icon (180x180)
  await sharp(finalAppIcon).resize(180, 180).png().toFile(path.join(publicIconsDir, "apple-touch-icon.png"));

  // favicon (32x32 & 48x48)
  await sharp(finalAppIcon).resize(32, 32).png().toFile(path.join(publicDir, "favicon.png"));

  // Also save preview
  await sharp(finalAppIcon).toFile(path.join(__dirname, "../public/images/bachelors-book-app-icon.png"));

  console.log("Emblem and app icons generated successfully!");
}

buildEmblem().catch(console.error);
