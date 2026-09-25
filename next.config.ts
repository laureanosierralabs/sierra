import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sin config especial: las Server Actions corren en el mismo origen
  // (localhost:3737), que Next permite por defecto.
};

export default nextConfig;
