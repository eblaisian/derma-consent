import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://js.stripe.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.digitaloceanspaces.com https://docs.derma-consent.de",
  "font-src 'self'",
  "connect-src 'self' https://api.stripe.com https://*.ingest.sentry.io " +
    (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"),
  "frame-src https://js.stripe.com",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
];

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: "../..",
  },
  headers: async () => {
    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-XSS-Protection", value: "1; mode=block" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
      { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
      { key: "Content-Security-Policy", value: cspDirectives.join("; ") },
    ];

    return [
      {
        // HTML pages — never serve stale, always revalidate on deploy
        source: "/((?!_next/static|_next/image|icons|favicon).*)",
        headers: [
          ...securityHeaders,
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
      {
        // Static assets (JS/CSS chunks) — immutable, content-hashed filenames
        source: "/_next/static/:path*",
        headers: [
          ...securityHeaders,
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // Icons and images in public/
        source: "/icons/:path*",
        headers: [
          ...securityHeaders,
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
    ];
  },
};

const configWithIntl = withNextIntl(nextConfig);

export default withSentryConfig(configWithIntl, {
  silent: true,
  disableLogger: true,
});
