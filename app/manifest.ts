import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Auto Centar DEA",
    short_name: "DEA",
    description: "Provjerena vozila u Zenici",
    start_url: "/",
    display: "standalone",
    background_color: "#111315",
    theme_color: "#111315",
    lang: "hr",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
