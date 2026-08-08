/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    // Expuestas al frontend para mostrar en qué rama/entorno corre la app.
    // Vercel provee estas variables de sistema en tiempo de build.
    NEXT_PUBLIC_GIT_BRANCH: process.env.VERCEL_GIT_COMMIT_REF || "local",
    NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV || "development",
  },
};

export default nextConfig;
