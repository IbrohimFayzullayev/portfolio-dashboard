/** @type {import('next').NextConfig} */
const nextConfig = {
  // Self-contained server bundle for a small Docker image (see Dockerfile).
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
