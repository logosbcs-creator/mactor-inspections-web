import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    domains: ["res.cloudinary.com"],
  },
  // Google/Zoho send the assistant's OAuth callbacks to this domain (Google
  // can't authorize *.up.railway.app); proxy them to the API on Railway.
  async rewrites() {
    return [
      {
        source: "/api/assistant/oauth/:path*",
        destination: "https://mactor-inspections-api-production.up.railway.app/api/assistant/oauth/:path*",
      },
    ];
  },
};

export default nextConfig;
