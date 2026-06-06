/**
 * JSON-LD structured data for the landing page. Honest by design: NO fabricated
 * aggregateRating/review counts (the spec suggested "4.8 / 127 reviews" — fake
 * review markup violates search engines' guidelines and can get you penalised).
 * Add a real AggregateRating only once you have genuine reviews.
 */
export function StructuredData() {
  const base = process.env.NEXTAUTH_URL ?? "https://utlagg.se";
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "Utlagg",
        url: base,
        description: "AI-driven kvittohantering för svenska företag.",
      },
      {
        "@type": "SoftwareApplication",
        name: "Utlagg",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        offers: {
          "@type": "Offer",
          price: "149",
          priceCurrency: "SEK",
          availability: "https://schema.org/OnlineOnly",
        },
      },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
