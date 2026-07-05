/**
 * Groups the ~26 granular BAS accounts (lib/bas.ts) into a small set of
 * human-friendly spending buckets for the Statistik dashboard. Grouping by
 * BAS code prefix (not the free-text category name) because basCode is the
 * reliable, structured value — category is just BAS_ACCOUNTS[code].name
 * copied in at save time, and matching against translated/edited text would
 * be fragile.
 */
export type SpendBucket =
  | "food"
  | "travel"
  | "office"
  | "it"
  | "marketing"
  | "professional"
  | "other";

export const BUCKET_LABELS: Record<SpendBucket, { sv: string; en: string; color: string }> = {
  // Warm, cohesive palette anchored on the terracotta brand accent. Each
  // category is a distinct hue but stays in warm/earthy territory (no cool
  // blues) so the charts match the rest of the rebranded UI.
  food: { sv: "Mat & representation", en: "Food & dining", color: "#C4522F" },        // terracotta (brand)
  travel: { sv: "Resor & transport", en: "Travel & transport", color: "#E08A3C" },   // warm amber-orange
  office: { sv: "Kontor & lokal", en: "Office & premises", color: "#D9A441" },        // ochre/gold
  it: { sv: "IT & programvara", en: "IT & software", color: "#8C6A4A" },              // warm taupe/brown
  marketing: { sv: "Marknadsföring", en: "Marketing", color: "#B8894F" },             // muted bronze
  professional: { sv: "Konsulter & utbildning", en: "Professional services", color: "#9E7B5B" }, // soft mocha
  other: { sv: "Övrigt", en: "Other", color: "#B0A69A" },                              // warm grey
};

const CODE_TO_BUCKET: Record<string, SpendBucket> = {
  "5800": "travel",
  "5810": "travel",
  "5831": "food",
  "5832": "food",
  "6071": "food",
  "6072": "food",
  "7631": "food",
  "5010": "office",
  "5020": "office",
  "5410": "office",
  "5460": "office",
  "6110": "office",
  "5611": "travel",
  "5615": "travel",
  "6212": "it",
  "6230": "it",
  "6540": "it",
  "6550": "it",
  "6560": "it",
  "5910": "marketing",
  "6420": "professional",
  "7610": "professional",
  "6970": "professional",
  "4000": "other",
  "6250": "other",
  "6990": "other",
};

export function bucketForBasCode(basCode: string | null | undefined): SpendBucket {
  if (!basCode) return "other";
  return CODE_TO_BUCKET[basCode] ?? "other";
}
