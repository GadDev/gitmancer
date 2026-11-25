import type { NextConfig } from "next";
const config: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  outputFileTracingIncludes: {
    "/*": [
      "./node_modules/@fontsource/cormorant-garamond/LICENSE",
      "./node_modules/@fontsource/dm-sans/LICENSE",
    ],
  },
  async rewrites() {
    return [
      {
        source: "/cards/:cardId([a-f0-9]{64}).png",
        destination: "/cards/:cardId/image",
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};
export default config;
