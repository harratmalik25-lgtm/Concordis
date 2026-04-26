import type { NextConfig } from "next";

const config: NextConfig = {
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options",        value: "DENY" },
        { key: "Referrer-Policy",        value: "strict-origin-when-cross-origin" },
        {
          key:   "Content-Security-Policy",
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "connect-src 'self' https://openrouter.ai https://eutils.ncbi.nlm.nih.gov https://api.semanticscholar.org",
            "img-src 'self' data:",
          ].join("; "),
        },
      ],
    },
  ],
};

export default config;
