import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Utlagg — AI-driven kvittohantering",
    short_name: "Utlagg",
    description:
      "Smart kvittoscanning med AI, svensk momshantering och Fortnox-integration.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#F4F1EA",
    theme_color: "#16181D",
    lang: "sv-SE",
    // Add /icon-192.png and /icon-512.png to public/ then list them here.
    icons: [],
  };
}
