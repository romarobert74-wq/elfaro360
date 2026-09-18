/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    // Expuestas al frontend para mostrar en qué rama/entorno corre la app.
    // Vercel provee estas variables de sistema en tiempo de build.
    NEXT_PUBLIC_GIT_BRANCH: process.env.VERCEL_GIT_COMMIT_REF || "local",
    NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV || "development",
  },
  async headers() {
    return [
      {
        // Los tours (botonera, ficha, puente y config) deben verse siempre
        // frescos: el navegador debe revalidar en cada carga en vez de servir
        // una versión vieja cacheada. Evita el "no me actualiza" tras editar.
        source: "/tours/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
