import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kvittino — AI-driven kvittohantering",
    short_name: "Kvittino",
    description:
      "Smart kvittoscanning med AI, svensk momshantering och Fortnox-integration.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#FAF8F3",
    theme_color: "#C4522F",
    lang: "sv-SE",
    icons: [
      {
        src: "/kvittino-mark.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
