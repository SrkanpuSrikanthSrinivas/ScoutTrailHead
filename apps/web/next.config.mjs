/** @type {import('next').NextConfig} */
const nextConfig = {
  // Bundle the shared workspace packages so Vercel builds them.
  transpilePackages: ["@trailhead/core", "@trailhead/db"],
};
export default nextConfig;
