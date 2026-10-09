const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const publicIconsDir = path.join(__dirname, "../public/icons");
const publicDir = path.join(__dirname, "../public");

if (!fs.existsSync(publicIconsDir)) {
  fs.mkdirSync(publicIconsDir, { recursive: true });
}

// 512x512 App Icon SVG with modern gradient, glass reflections, and 3D ledger emblem
const iconSvg = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Outer Gradient (Deep Violet to Electric Fuchsia) -->
    <linearGradient id="bgGrad" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#4f46e5" />
      <stop offset="35%" stop-color="#7c3aed" />
      <stop offset="70%" stop-color="#c026d3" />
      <stop offset="100%" stop-color="#ec4899" />
    </linearGradient>

    <!-- Glass Overlay Radial Gradient -->
    <radialGradient id="glassGlow" cx="256" cy="120" r="280" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.32" />
      <stop offset="60%" stop-color="#ffffff" stop-opacity="0.05" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
    </radialGradient>

    <!-- Ledger Cover Gradient -->
    <linearGradient id="bookCover" x1="100" y1="120" x2="412" y2="400" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#f1f5f9" />
    </linearGradient>

    <!-- Book Spine Gradient -->
    <linearGradient id="spineGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#6366f1" />
      <stop offset="100%" stop-color="#4338ca" />
    </linearGradient>

    <!-- Gold Accent for Rupee -->
    <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fbbf24" />
      <stop offset="50%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>

    <!-- Cyan Ribbon Gradient -->
    <linearGradient id="ribbonGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#0284c7" />
    </linearGradient>

    <!-- Drop Shadows -->
    <filter id="cardShadow" x="60" y="80" width="392" height="340" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#1e1b4b" flood-opacity="0.45" />
    </filter>
    <filter id="starGlow" x="320" y="80" width="120" height="120" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="4" stdDeviation="10" flood-color="#fbbf24" flood-opacity="0.6" />
    </filter>
  </defs>

  <!-- App Icon Squircle Background -->
  <rect width="512" height="512" rx="116" fill="url(#bgGrad)" />

  <!-- Glass Light Reflection -->
  <rect width="512" height="512" rx="116" fill="url(#glassGlow)" />
  <rect x="12" y="12" width="488" height="488" rx="104" stroke="#ffffff" stroke-width="4" stroke-opacity="0.25" fill="none" />

  <!-- Decorative Background Ring -->
  <circle cx="256" cy="256" r="180" stroke="#ffffff" stroke-opacity="0.08" stroke-width="32" fill="none" />

  <!-- Center 3D Book Ledger Element -->
  <g filter="url(#cardShadow)">
    <!-- Book Back / Pages Depth -->
    <rect x="116" y="146" width="280" height="236" rx="28" fill="#e2e8f0" opacity="0.9" />
    <rect x="120" y="140" width="272" height="236" rx="26" fill="#f8fafc" />

    <!-- Left Page -->
    <path d="M124 140 H250 V372 H124 C112 372 104 362 104 348 V164 C104 150 112 140 124 140 Z" fill="url(#bookCover)" />

    <!-- Spine Divider Line -->
    <path d="M250 136 V376" stroke="#cbd5e1" stroke-width="4" stroke-linecap="round" />
    <path d="M246 136 V376" stroke="#94a3b8" stroke-width="2" stroke-opacity="0.5" />

    <!-- Left Page: Ledger Lines -->
    <rect x="136" y="176" width="86" height="10" rx="5" fill="#818cf8" opacity="0.8" />
    <rect x="136" y="202" width="70" height="7" rx="3.5" fill="#94a3b8" opacity="0.6" />
    <rect x="136" y="222" width="80" height="7" rx="3.5" fill="#94a3b8" opacity="0.6" />
    <rect x="136" y="242" width="60" height="7" rx="3.5" fill="#94a3b8" opacity="0.6" />

    <!-- Mini chart bar on left page -->
    <rect x="136" y="292" width="14" height="42" rx="4" fill="#a855f7" />
    <rect x="156" y="278" width="14" height="56" rx="4" fill="#8b5cf6" />
    <rect x="176" y="264" width="14" height="70" rx="4" fill="#6366f1" />
    <rect x="196" y="250" width="14" height="84" rx="4" fill="#4f46e5" />

    <!-- Right Page: Indian Rupee (₹) Financial Seal -->
    <!-- Circular Seal Backdrop -->
    <circle cx="324" cy="256" r="54" fill="url(#bgGrad)" opacity="0.08" />
    <circle cx="324" cy="256" r="50" stroke="url(#bgGrad)" stroke-width="3" stroke-dasharray="4 4" fill="none" opacity="0.4" />

    <!-- Glowing Indian Rupee Symbol -->
    <g transform="translate(304, 218) scale(1.15)">
      <!-- Top Bar -->
      <rect x="0" y="0" width="36" height="6.5" rx="3.25" fill="#4f46e5" />
      <!-- Middle Bar -->
      <rect x="0" y="14" width="30" height="6.5" rx="3.25" fill="#4f46e5" />
      <!-- Curved Loop -->
      <path d="M12 0 V34 C24 34 32 26 32 17 C32 8 24 0 12 0" stroke="#4f46e5" stroke-width="6.5" stroke-linecap="round" fill="none" />
      <!-- Leg Stroke -->
      <line x1="15" y1="31" x2="33" y2="62" stroke="#7c3aed" stroke-width="7" stroke-linecap="round" />
    </g>

    <!-- Bookmark Ribbon Hanging at Top -->
    <path d="M228 126 V176 L238 166 L248 176 V126 Z" fill="url(#ribbonGrad)" />
  </g>

  <!-- Top-Right Sparkling Star (Success / Prosperity) -->
  <g filter="url(#starGlow)">
    <circle cx="380" cy="130" r="24" fill="url(#goldGrad)" />
    <!-- 4-point Diamond Star Center -->
    <path d="M380 114 L384 126 L396 130 L384 134 L380 146 L376 134 L364 130 L376 126 Z" fill="#ffffff" />
    <circle cx="380" cy="130" r="3" fill="#fbbf24" />
  </g>
</svg>`;

// Safe Maskable 512x512 with safe area margin (80% scale centered)
const maskableSvg = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Full Bleed Background for Maskable Icon -->
  <rect width="512" height="512" fill="url(#bgGrad)" />

  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#4f46e5" />
      <stop offset="35%" stop-color="#7c3aed" />
      <stop offset="70%" stop-color="#c026d3" />
      <stop offset="100%" stop-color="#ec4899" />
    </linearGradient>
    <linearGradient id="bookCover" x1="100" y1="120" x2="412" y2="400" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#f1f5f9" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fbbf24" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
    <linearGradient id="ribbonGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#0284c7" />
    </linearGradient>
    <filter id="cardShadow" x="60" y="80" width="392" height="340" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#1e1b4b" flood-opacity="0.4" />
    </filter>
  </defs>

  <!-- Scale centered by 0.78 to guarantee safe area in all circle/squircle masks -->
  <g transform="translate(56, 56) scale(0.78)">
    <g filter="url(#cardShadow)">
      <rect x="116" y="146" width="280" height="236" rx="28" fill="#e2e8f0" opacity="0.9" />
      <rect x="120" y="140" width="272" height="236" rx="26" fill="#f8fafc" />
      <path d="M124 140 H250 V372 H124 C112 372 104 362 104 348 V164 C104 150 112 140 124 140 Z" fill="url(#bookCover)" />
      <path d="M250 136 V376" stroke="#cbd5e1" stroke-width="4" stroke-linecap="round" />

      <rect x="136" y="176" width="86" height="10" rx="5" fill="#818cf8" opacity="0.8" />
      <rect x="136" y="202" width="70" height="7" rx="3.5" fill="#94a3b8" opacity="0.6" />
      <rect x="136" y="222" width="80" height="7" rx="3.5" fill="#94a3b8" opacity="0.6" />

      <rect x="136" y="292" width="14" height="42" rx="4" fill="#a855f7" />
      <rect x="156" y="278" width="14" height="56" rx="4" fill="#8b5cf6" />
      <rect x="176" y="264" width="14" height="70" rx="4" fill="#6366f1" />
      <rect x="196" y="250" width="14" height="84" rx="4" fill="#4f46e5" />

      <circle cx="324" cy="256" r="54" fill="url(#bgGrad)" opacity="0.08" />
      <circle cx="324" cy="256" r="50" stroke="url(#bgGrad)" stroke-width="3" stroke-dasharray="4 4" fill="none" opacity="0.4" />

      <g transform="translate(304, 218) scale(1.15)">
        <rect x="0" y="0" width="36" height="6.5" rx="3.25" fill="#4f46e5" />
        <rect x="0" y="14" width="30" height="6.5" rx="3.25" fill="#4f46e5" />
        <path d="M12 0 V34 C24 34 32 26 32 17 C32 8 24 0 12 0" stroke="#4f46e5" stroke-width="6.5" stroke-linecap="round" fill="none" />
        <line x1="15" y1="31" x2="33" y2="62" stroke="#7c3aed" stroke-width="7" stroke-linecap="round" />
      </g>

      <path d="M228 126 V176 L238 166 L248 176 V126 Z" fill="url(#ribbonGrad)" />
    </g>

    <circle cx="380" cy="130" r="24" fill="url(#goldGrad)" />
    <path d="M380 114 L384 126 L396 130 L384 134 L380 146 L376 134 L364 130 L376 126 Z" fill="#ffffff" />
  </g>
</svg>`;

async function main() {
  console.log("Writing SVGs...");
  const svgPath = path.join(publicIconsDir, "icon.svg");
  fs.writeFileSync(svgPath, iconSvg);
  fs.writeFileSync(path.join(publicIconsDir, "logo.svg"), iconSvg);

  const maskableSvgPath = path.join(publicIconsDir, "icon-maskable.svg");
  fs.writeFileSync(maskableSvgPath, maskableSvg);

  console.log("Generating PNG icons via Sharp...");
  // 512x512
  await sharp(Buffer.from(iconSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicIconsDir, "icon-512x512.png"));

  // 512x512 maskable
  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicIconsDir, "icon-maskable-512x512.png"));

  // 192x192
  await sharp(Buffer.from(iconSvg))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicIconsDir, "icon-192x192.png"));

  // Copy 192x192 to public root
  await sharp(Buffer.from(iconSvg))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, "icon-192x192.png"));

  // Apple Touch Icon (180x180)
  await sharp(Buffer.from(iconSvg))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicIconsDir, "apple-touch-icon.png"));

  // Favicon (32x32 & 48x48)
  await sharp(Buffer.from(iconSvg))
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, "favicon.png"));

  console.log("All modern KhataBook logo icons successfully generated!");
}

main().catch(console.error);
