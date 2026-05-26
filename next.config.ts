import type { NextConfig } from "next";

// Hostname Supabase du projet, utilisé pour autoriser next/image à
// servir les fichiers publics du Storage (avatars, photos, etc.).
// On dérive du NEXT_PUBLIC_SUPABASE_URL pour ne rien hardcoder.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHost = supabaseUrl ? new URL(supabaseUrl).hostname : null;

const securityHeaders = [
  // Empêche l'app d'être embarquée dans une iframe externe (clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  // Empêche le navigateur de deviner le content-type (XSS via mime sniffing).
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Réduit la fuite d'info via Referer vers les sites externes.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Force HTTPS pour 2 ans + preload list. Vercel sert déjà en HTTPS.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Désactive les APIs sensibles dont l'app n'a pas besoin.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHost
      ? [
          {
            protocol: "https",
            hostname: supabaseHost,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
  async headers() {
    return [
      {
        // Applique les security headers à toutes les routes.
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
