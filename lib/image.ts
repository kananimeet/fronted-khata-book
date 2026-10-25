/**
 * Helper to resolve image URLs across the application.
 * Supports:
 * - Cloudinary URLs ("https://res.cloudinary.com/...")
 * - External HTTP/HTTPS URLs
 * - Local blob/data URLs for client-side previews
 * - Legacy relative upload paths ("/uploads/...")
 */
export const getImageUrl = (
  path?: string | null,
  fallback: string = "/placeholder-avatar.png"
): string => {
  if (!path || typeof path !== "string" || path.trim() === "") {
    return fallback;
  }

  const trimmed = path.trim();

  // If path is already a full URL (Cloudinary, external HTTP/HTTPS, or preview blob/data)
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:")
  ) {
    if (trimmed.includes("devtunnels.ms") && !trimmed.includes("tunnel-skip-anti-phishing-page")) {
      const sep = trimmed.includes("?") ? "&" : "?";
      return `${trimmed}${sep}z-tunnel-skip-anti-phishing-page=true`;
    }
    return trimmed;
  }

  // If path is a legacy relative path (/uploads/...)
  const rawBase =
    process.env.NEXT_PUBLIC_ASSET_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.VITE_API_URL ||
    "";

  // If base URL ends with /api/v1, strip it so static asset path /uploads/... resolves correctly against backend host
  const baseUrl = rawBase.replace(/\/api\/v1\/?$/, "");
  const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;

  let finalUrl = cleanBase ? `${cleanBase}${cleanPath}` : cleanPath;
  if (finalUrl.includes("devtunnels.ms") && !finalUrl.includes("tunnel-skip-anti-phishing-page")) {
    const sep = finalUrl.includes("?") ? "&" : "?";
    finalUrl = `${finalUrl}${sep}z-tunnel-skip-anti-phishing-page=true`;
  }

  return finalUrl;
};

export default getImageUrl;
