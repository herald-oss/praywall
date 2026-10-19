import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Unos Por Otros — Praywall",
    short_name: "Praywall",
    description: "Muro de oración: al menos 33 personas oran por cada petición. / Prayer wall: at least 33 people pray for every request.",
    start_url: "/",
    display: "standalone",
    background_color: "#151517",
    theme_color: "#151517",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
