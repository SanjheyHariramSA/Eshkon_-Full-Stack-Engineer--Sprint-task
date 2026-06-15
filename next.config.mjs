/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // Server Actions are stable in 15, kept explicit for reviewers.
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  // Contentful image CDN, in case section props reference assets.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.ctfassets.net" },
      { protocol: "https", hostname: "assets.ctfassets.net" },
    ],
  },
};

export default nextConfig;
