import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Las Server Actions corren en el mismo origen, que Next permite por defecto.
  experimental: {
    serverActions: {
      // Imágenes de portadas (hasta 4 MB). El default de 1 MB las rechazaba.
      // Vercel corta cualquier pedido en 4,5 MB: no tiene sentido subirlo más.
      bodySizeLimit: "5mb",
    },
  },
};

export default nextConfig;
