import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://example.supabase.co";
const supabase = new URL(supabaseUrl);
const supabaseOrigin = supabase.origin;

/**
 * Content Security Policy.
 * 'unsafe-inline' za skripte je potreban jer Next.js umeće inline skripte za hidraciju,
 * a nonce bi sve javne stranice učinio dinamičnima (gubi se keširanje). Rizik je ograničen:
 * nema korisničkog HTML-a, sav sadržaj se escapea, a vanjski izvori su na popisu.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabaseOrigin}`,
  "font-src 'self'",
  `connect-src 'self' ${supabaseOrigin} https://challenges.cloudflare.com`,
  // Google Maps: mala karta s lokacijom salona u kontakt sekciji
  "frame-src https://challenges.cloudflare.com https://www.google.com https://maps.google.com",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  ...(process.env.NODE_ENV === "production" ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    // Samo WebP: AVIF se na serveru kodira višestruko sporije (prvo otvaranje nove
    // fotografije), a dobitak u veličini je mali jer su fotografije već WebP.
    formats: ["image/webp"],
    deviceSizes: [384, 640, 828, 1080, 1280, 1600, 1920],
    imageSizes: [88, 160, 256, 384],
    qualities: [75],
    // Lokalni Supabase (127.0.0.1) radi samo u razvoju
    dangerouslyAllowLocalIP: process.env.NODE_ENV === "development",
    minimumCacheTTL: 2678400, // 31 dan — putanje slika su nepromjenjive (UUID)
    remotePatterns: [
      {
        protocol: supabase.protocol.replace(":", "") as "http" | "https",
        hostname: supabase.hostname,
        port: supabase.port,
        pathname: "/storage/v1/object/public/vehicle-images/**",
      },
    ],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }, { key: "Cache-Control", value: "private, no-store" }] },
      { source: "/api/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex" }] },
      { source: "/fonts/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
    ];
  },
};

export default nextConfig;
