/**
 * Receipt OCR via Google Cloud Vision (TEXT_DETECTION).
 *
 * Vision returns raw text; it does NOT understand "this is the total" or
 * "this is the VAT". We run lightweight Swedish-aware heuristics over the text
 * to pull out the fields we care about, each with a rough confidence score.
 *
 * For higher accuracy in production, consider Google Document AI's
 * "Expense Parser" or Azure Document Intelligence's prebuilt receipt model,
 * which return structured fields directly. The function signature below is
 * deliberately provider-agnostic so you can swap the implementation.
 */

export interface ExtractedReceipt {
  vendorName: string | null;
  orgNumber: string | null;
  receiptNumber: string | null;
  date: string | null; // ISO yyyy-mm-dd
  totalAmount: number | null;
  vatAmount: number | null;
  vatRate: 6 | 12 | 25 | null;
  rawText: string;
  confidence: number; // 0..1, aggregate
}

const VISION_URL = "https://vision.googleapis.com/v1/images:annotate";

export async function runOcr(imageBase64: string): Promise<ExtractedReceipt> {
  const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_CLOUD_API_KEY is not set");
  }

  // Strip a data-URL prefix if present.
  const content = imageBase64.replace(/^data:image\/\w+;base64,/, "");

  const res = await fetch(`${VISION_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requests: [
        {
          image: { content },
          features: [{ type: "TEXT_DETECTION", maxResults: 1 }],
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Vision API error ${res.status}: ${body}`);
  }

  const data = (await res.json()) as {
    responses?: Array<{ fullTextAnnotation?: { text?: string } }>;
  };
  const rawText = data.responses?.[0]?.fullTextAnnotation?.text ?? "";

  return parseReceiptText(rawText);
}

/**
 * Free server-side OCR via OCR.space. Runs on the server, so there is NO browser
 * Web Worker and therefore NO Content-Security-Policy issue. Set OCR_SPACE_API_KEY
 * to your own free key (ocr.space/ocrapi); falls back to the demo key otherwise.
 */
export async function runOcrSpace(imageBase64: string): Promise<ExtractedReceipt> {
  const apiKey = process.env.OCR_SPACE_API_KEY || "helloworld";
  const dataUrl = imageBase64.startsWith("data:")
    ? imageBase64
    : `data:image/jpeg;base64,${imageBase64}`;

  const form = new URLSearchParams();
  form.set("base64Image", dataUrl);
  form.set("language", "swe");
  // Engine 1 supports Swedish ('swe'); Engine 2 rejects it (error E201).
  form.set("OCREngine", "1");
  form.set("scale", "true");
  form.set("detectOrientation", "true");
  form.set("isOverlayRequired", "false");

  const res = await fetch("https://api.ocr.space/parse/image", {
    method: "POST",
    headers: { apikey: apiKey, "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  if (!res.ok) throw new Error(`OCR.space error ${res.status}`);

  const data = (await res.json()) as {
    ParsedResults?: Array<{ ParsedText?: string }>;
    IsErroredOnProcessing?: boolean;
    ErrorMessage?: string | string[];
  };
  if (data.IsErroredOnProcessing) {
    throw new Error(
      Array.isArray(data.ErrorMessage) ? data.ErrorMessage.join("; ") : data.ErrorMessage ?? "OCR failed",
    );
  }
  const rawText = data.ParsedResults?.[0]?.ParsedText ?? "";
  return parseReceiptText(rawText);
}

/* ----------------------- heuristic parsing ----------------------- */

// Amount with optional thousands separators and optional 1-2 decimal digits.
const AMOUNT_RE = /(\d{1,3}(?:[ .,]\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)/;
const AMOUNT_RE_G = new RegExp(AMOUNT_RE.source, "g");

// Handle both EU ("1.234,56") and US ("1,234.56") number formats.
function toNumber(raw: string): number | null {
  let s = raw.replace(/[^\d.,]/g, "");
  if (!s) return null;
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma > -1 || lastDot > -1) {
    const decSep = lastComma > lastDot ? "," : ".";
    const thouSep = decSep === "," ? "." : ",";
    s = s.split(thouSep).join("");
    s = s.replace(decSep, ".");
  }
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

function allAmounts(text: string): number[] {
  const out: number[] = [];
  const matches = text.match(AMOUNT_RE_G) ?? [];
  for (const m of matches) {
    const n = toNumber(m);
    // Ignore bare years / tiny integers that are usually not money.
    if (n != null && n >= 1 && !(Number.isInteger(n) && n >= 1900 && n <= 2100)) {
      out.push(n);
    }
  }
  return out;
}

const KNOWN_MERCHANTS: Array<[RegExp, string]> = [
  [/biltema/i, "Biltema"],
  [/bauhaus/i, "Bauhaus"],
  [/willy.?s|willy/i, "Willys"],
  [/\bica\b/i, "ICA"],
  [/\bcoop\b/i, "Coop"],
  [/hemköp|hemkop/i, "Hemköp"],
  [/citygross|city gross/i, "City Gross"],
  [/lidl/i, "Lidl"],
  [/\btempo\b/i, "Tempo"],
  [/\bk-?rauta|krauta/i, "K-Rauta"],
  [/byggmax/i, "Byggmax"],
  [/\bjula\b/i, "Jula"],
  [/\brusta\b/i, "Rusta"],
  [/dollarstore|dollar store/i, "DollarStore"],
  [/\bikea\b/i, "IKEA"],
  [/\bjysk\b/i, "Jysk"],
  [/ahlsell/i, "Ahlsell"],
  [/beijer/i, "Beijer"],
  [/granngård|granngard/i, "Granngården"],
  [/mekonomen/i, "Mekonomen"],
  [/plantagen/i, "Plantagen"],
  [/blomsterland/i, "Blomsterlandet"],
  [/systembolaget/i, "Systembolaget"],
  [/clas ohlson/i, "Clas Ohlson"],
  [/kjell ?(&|och)? ?company|kjell\.com/i, "Kjell & Company"],
  [/teknikmagasinet/i, "Teknikmagasinet"],
  [/\bxxl\b/i, "XXL"],
  [/stadium/i, "Stadium"],
  [/intersport/i, "Intersport"],
  [/åhléns|ahlens/i, "Åhléns"],
  [/\bgekås|gekas\b/i, "Gekås"],
  [/h\s?&\s?m|hennes ?&? ?mauritz/i, "H&M"],
  [/kappahl/i, "KappAhl"],
  [/lindex/i, "Lindex"],
  [/\bnormal\b/i, "Normal"],
  [/circle ?k|statoil|preem|\bokq8\b|shell|ingo\b|\bst1\b/i, "Drivmedel"],
  [/pressbyrån|pressbyran|7-?eleven/i, "Pressbyrån"],
  [/espresso house|wayne|starbucks/i, "Café"],
  [/elgiganten|media ?markt|power\b|netonnet|webhallen/i, "Elektronik"],
  [/apoteket|apotek hjärtat|kronans|apotea/i, "Apotek"],
  [/\bsj\b|\bvy\b|\bsl\b|taxi|uber|bolt/i, "Resa"],
];

// A token that is clearly a phone number / org number / postcode, not money.
function looksLikePhoneOrgOrUrl(line: string): boolean {
  return (
    /\b(tlf|tel|telefon|phone|fax)\b/i.test(line) ||
    /\borg\.?\s*nr\b|\bvat\b|momsreg/i.test(line) ||
    /\d{6}-\d{4}\b/.test(line) || // Swedish org/VAT number
    /\bwww\.|\.se\b|\.com\b|@/i.test(line) ||
    /\bS-?\d{3}\s?\d{2}\b/.test(line) // postcode like S-721 38
  );
}

// Largest amount WITH decimals on a single line (totals are written x,xx).
function decimalAmountOnLine(line: string): number | null {
  const matches = line.match(/\d{1,3}(?:[ .]\d{3})*[.,]\d{2}|\d+[.,]\d{2}/g);
  if (!matches) return null;
  const nums = matches.map(toNumber).filter((n): n is number => n != null);
  return nums.length ? Math.max(...nums) : null;
}

export function parseReceiptText(rawText: string): ExtractedReceipt {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const lower = rawText.toLowerCase();

  let confidenceHits = 0;
  const totalSignals = 4;

  // --- Receipt / kvitto number (only when clearly labelled) ---
  // Real receipts vary a lot in how this is printed: "Bongnr", "Bong nr:",
  // "Kvittonummer", "Ordernr", "Transaktion", "Receipt No." — the label and
  // the digits can also land on separate lines after OCR. This matches the
  // label word(s) first, then allows an optional second word (nr/nummer/no),
  // then any punctuation/whitespace (including a line break), then digits.
  const recM = rawText.match(
    /(?:kvitto|bong|kassakvitto|transaktion|order|receipt)\s*(?:nr|nummer|no)?\.?\s*[:.#]?\s*(\d{2,})/i,
  );
  const receiptNumber = recM ? recM[1] : null;

  // --- Org number (Swedish): 6 digits - 4 digits ---
  const orgM = rawText.match(/(\d{6})-(\d{4})/);
  const orgNumber = orgM ? `${orgM[1]}-${orgM[2]}` : null;

  // --- Vendor ---
  let vendorName: string | null = null;
  for (const [re, name] of KNOWN_MERCHANTS) {
    if (re.test(lower)) { vendorName = name; break; }
  }
  if (!vendorName) {
    // Website domain → name (e.g. www.bauhaus.se → Bauhaus).
    const dom = rawText.match(/(?:www\.)?([a-zA-ZåäöÅÄÖ][a-zA-Z0-9åäöÅÄÖ-]{2,})\.(?:se|com|nu)\b/);
    if (dom) vendorName = dom[1].charAt(0).toUpperCase() + dom[1].slice(1);
  }
  if (!vendorName) {
    // Company line near the top: "X SWEDEN AB" / "X Aktiebolag".
    const abLine = lines.slice(0, 8).find(
      (l) => /\b(aktiebolag|AB|HB|KB)\b/.test(l) && !looksLikePhoneOrgOrUrl(l) && /[A-Za-zÅÄÖåäö]{3,}/.test(l),
    );
    if (abLine) {
      vendorName = abLine
        .replace(/\b(sweden|sverige|norge|nordic)\b/gi, "")
        .replace(/\b(aktiebolag|AB|HB|KB)\b\.?/gi, "")
        .replace(/\s{2,}/g, " ")
        .trim();
    }
  }
  if (!vendorName) {
    vendorName =
      lines.find(
        (l) =>
          /[A-Za-zÅÄÖåäö]{3,}/.test(l) &&
          !/^\d{1,2}[:.]\d{2}/.test(l) &&
          !looksLikePhoneOrgOrUrl(l) &&
          !/\b\d{4,}\b/.test(l), // skip lines dominated by long numbers
      ) ?? lines[0] ?? null;
  }
  // Clean leading junk (e.g. a misread "*" from a logo) and trailing noise.
  if (vendorName) {
    vendorName = vendorName.replace(/^[^A-Za-zÅÄÖåäö0-9]+/, "").trim() || vendorName;
  }
  if (vendorName) confidenceHits++;

  // --- Date: ISO, dd/mm/yyyy, dd-mm-yyyy, and footer "DD MM YY" ---
  const pad = (s: string) => s.padStart(2, "0");
  let date: string | null = null;
  const iso = rawText.match(/(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})/);
  const dmy = rawText.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})\b/);
  if (iso) {
    date = `${iso[1]}-${pad(iso[2])}-${pad(iso[3])}`;
  } else if (dmy) {
    const yr = dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3];
    date = `${yr}-${pad(dmy[2])}-${pad(dmy[1])}`;
  } else {
    // Space-separated footer date "DD MM YY" (e.g. 29 09 14), maybe + time.
    const sp = rawText.match(/\b(\d{2})\s(\d{2})\s(\d{2})\b/);
    if (sp) {
      const d = +sp[1], mo = +sp[2];
      if (d >= 1 && d <= 31 && mo >= 1 && mo <= 12) date = `20${pad(sp[3])}-${pad(sp[2])}-${pad(sp[1])}`;
    }
  }
  if (date) confidenceHits++;

  // --- Total: labelled line with a decimal amount, ignoring change/cash rows ---
  let totalAmount: number | null = null;
  const TOTAL_RE = /\b(total|totalt|att\s*betala|summa|grand total|amount due|to pay)\b/i;
  const EXCLUDE_RE =
    /moms|netto|brutto|mottaget|kontant|\båter\b|\bater\b|växel|vaxel|change|tillbaka|retur|öresavrund|oresavrund|avrund|dragning|växelpengar/i;
  // A line carrying a negative amount is change/refund, never the total.
  const isNegative = (l: string) => /[-−]\s*\d/.test(l);
  const totalCandidates = lines.filter(
    (l) => TOTAL_RE.test(l) && !EXCLUDE_RE.test(l) && !isNegative(l) && decimalAmountOnLine(l) != null,
  );
  if (totalCandidates.length) {
    totalAmount = Math.max(...totalCandidates.map((l) => decimalAmountOnLine(l)!));
  }
  if (totalAmount == null) {
    // Fallback: largest decimal amount on a line that isn't a phone/org row,
    // a VAT/net/gross breakdown, cash given, change returned, or a negative.
    const candidates: number[] = [];
    for (const l of lines) {
      if (looksLikePhoneOrgOrUrl(l) || EXCLUDE_RE.test(l) || isNegative(l)) continue;
      const a = decimalAmountOnLine(l);
      if (a != null) candidates.push(a);
    }
    if (candidates.length) totalAmount = Math.max(...candidates);
  }
  if (totalAmount != null) confidenceHits++;

  // --- VAT rate + amount ---
  let vatAmount: number | null = null;
  let vatRate: 6 | 12 | 25 | null = null;
  const rateM = rawText.match(/moms%?\s*[:=]?\s*(\d{1,2})|(\d{1,2})\s*%\s*(?:av|moms|vat)/i);
  const rawRate = rateM ? Number(rateM[1] ?? rateM[2]) : null;
  if (rawRate === 6 || rawRate === 12 || rawRate === 25) vatRate = rawRate;
  // VAT amount: a "moms" line (not the "moms%" header) with a decimal amount.
  const momsLine = lines.find(
    (l) => /\bmoms\b/i.test(l) && !/moms%/i.test(l) && !/\bav\b/i.test(l) && decimalAmountOnLine(l) != null,
  );
  if (momsLine) vatAmount = decimalAmountOnLine(momsLine);

  // Cross-fill: if we have two of {total, vatAmount, vatRate} infer the third.
  if (vatRate == null && vatAmount != null && totalAmount != null && totalAmount > vatAmount) {
    const net = totalAmount - vatAmount;
    const pct = (vatAmount / net) * 100;
    const nearest = [6, 12, 25].reduce((a, b) => (Math.abs(b - pct) < Math.abs(a - pct) ? b : a));
    if (Math.abs(nearest - pct) <= 1.5) vatRate = nearest as 6 | 12 | 25;
  }
  if (vatAmount == null && vatRate != null && totalAmount != null) {
    vatAmount = Math.round((totalAmount - totalAmount / (1 + vatRate / 100)) * 100) / 100;
  }

  if (vatAmount != null || vatRate != null) confidenceHits++;

  const confidence = rawText ? confidenceHits / totalSignals : 0;

  return {
    vendorName,
    orgNumber,
    receiptNumber,
    date,
    totalAmount,
    vatAmount,
    vatRate,
    rawText,
    confidence: Math.round(confidence * 100) / 100,
  };
}

export const OCR_CONFIDENCE_THRESHOLD = 0.8;

/**
 * Mindee Expense-Receipts API — a receipt-trained model that returns structured
 * fields (vendor, date, total, taxes, org number) directly, instead of us
 * guessing from raw OCR text. Enabled only when MINDEE_API_KEY is set; the
 * caller falls back to OCR.space/Vision if this throws.
 */
export async function runMindee(image: string): Promise<ExtractedReceipt> {
  const key = process.env.MINDEE_API_KEY;
  if (!key) throw new Error("MINDEE_API_KEY not set");

  const base64 = image.replace(/^data:[^;]+;base64,/, "");
  const bytes = Buffer.from(base64, "base64");
  const form = new FormData();
  form.append("document", new Blob([bytes], { type: "image/jpeg" }), "receipt.jpg");

  const res = await fetch(
    "https://api.mindee.net/v1/products/mindee/expense_receipts/v5/predict",
    { method: "POST", headers: { Authorization: `Token ${key}` }, body: form },
  );
  if (!res.ok) throw new Error(`Mindee HTTP ${res.status}`);

  // Defensive parsing — field names per Mindee Expense-Receipts v5.
  const json = (await res.json()) as Record<string, unknown>;
  const doc = json?.document as { inference?: { prediction?: Record<string, unknown> } } | undefined;
  const p = (doc?.inference?.prediction ?? {}) as Record<string, unknown>;
  const field = (k: string) => p[k] as { value?: unknown } | undefined;
  const strOf = (k: string): string | null => {
    const v = field(k)?.value;
    return v == null || v === "" ? null : String(v);
  };
  const numOf = (k: string): number | null => {
    const v = field(k)?.value;
    return v == null || v === "" ? null : Number(v);
  };

  const totalAmount = numOf("total_amount");
  const taxes = (Array.isArray(p.taxes) ? p.taxes : []) as Array<{ value?: number; rate?: number }>;
  const firstTax = taxes.find((t) => t && (t.value != null || t.rate != null)) ?? null;

  let vatAmount = numOf("total_tax");
  if (vatAmount == null && firstTax?.value != null) vatAmount = Number(firstTax.value);

  let vatRate: 6 | 12 | 25 | null = null;
  const rate = firstTax?.rate != null ? Number(firstTax.rate) : null;
  if (rate != null) {
    const nearest = [6, 12, 25].reduce((a, b) => (Math.abs(b - rate) < Math.abs(a - rate) ? b : a));
    if (Math.abs(nearest - rate) <= 2) vatRate = nearest as 6 | 12 | 25;
  }

  const regs = (Array.isArray(p.supplier_company_registrations)
    ? p.supplier_company_registrations
    : []) as Array<{ value?: string }>;

  return {
    vendorName: strOf("supplier_name"),
    orgNumber: regs.length ? (regs[0]?.value ?? null) : null,
    receiptNumber: strOf("receipt_number"),
    date: strOf("date"),
    totalAmount,
    vatAmount,
    vatRate,
    rawText: "",
    confidence: 0.95,
  };
}

/**
 * Vision LLM extraction — sends the receipt IMAGE to a multimodal model that
 * reads the layout the way a person would, returning structured fields. This is
 * the most accurate path (handles logos, table-style VAT, cash/change rows).
 * Enabled when OPENAI_API_KEY is set; callers fall back to Mindee/OCR on error.
 */
export async function runVisionLLM(image: string): Promise<ExtractedReceipt> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY not set");

  const dataUrl = image.startsWith("data:") ? image : `data:image/jpeg;base64,${image}`;
  const prompt = `You read Swedish receipts (kvitton). Return ONLY a JSON object (no markdown) with exactly these keys:
{
  "vendorName": string|null,     // store/company name, e.g. "Bauhaus", "Willys"
  "orgNumber": string|null,      // Swedish org number like "969630-6944"
  "receiptNumber": string|null,  // kvittonummer / bong / receipt no. if printed
  "date": string|null,           // purchase date as YYYY-MM-DD
  "totalAmount": number|null,    // amount actually PAID (grand total). NOT cash given ("Mottaget"), NOT change ("Åter"/"Växel"), NOT a phone or org number
  "vatRate": number|null,        // main VAT percent: 6, 12 or 25
  "vatAmount": number|null       // VAT amount in kronor ("Moms")
}
Use a dot as the decimal separator. Return null for anything not clearly printed. If several VAT rates appear, pick the main one.`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: process.env.OPENAI_VISION_MODEL || "gpt-4o-mini",
      max_tokens: 500,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You extract structured data from receipt images and reply with JSON only." },
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`);

  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = json?.choices?.[0]?.message?.content ?? "{}";
  let data: Record<string, unknown> = {};
  try {
    data = JSON.parse(content);
  } catch {
    data = {};
  }
  const num = (v: unknown): number | null => (v == null || v === "" ? null : Number(v));
  const str = (v: unknown): string | null => (v == null || v === "" ? null : String(v));
  let vatRate: 6 | 12 | 25 | null = null;
  const r = num(data.vatRate);
  if (r === 6 || r === 12 || r === 25) vatRate = r;

  return {
    vendorName: str(data.vendorName),
    orgNumber: str(data.orgNumber),
    receiptNumber: str(data.receiptNumber),
    date: str(data.date),
    totalAmount: num(data.totalAmount),
    vatAmount: num(data.vatAmount),
    vatRate,
    rawText: "",
    confidence: 0.97,
  };
}

/**
 * Read a SINGLE field from a small cropped region the user pointed to.
 * Uses the vision LLM when configured (most accurate on a tight crop),
 * otherwise OCR.space. Returns the best-effort plain-text value.
 */
const FIELD_HINTS: Record<string, string> = {
  receiptNumber: "the receipt or invoice number (kvittonummer / fakturanummer / bong)",
  vendorName: "the store or company name",
  date: "the date, formatted as YYYY-MM-DD",
  totalAmount: "the total amount paid, digits only with a dot decimal",
  vatAmount: "the VAT (moms) amount in kronor, digits only with a dot decimal",
  vatRate: "the VAT (moms) percentage, just the number (6, 12 or 25)",
};

export async function readRegion(crop: string, field: string): Promise<string> {
  const hint = FIELD_HINTS[field] ?? "the value";
  const key = process.env.OPENAI_API_KEY;

  if (key) {
    const dataUrl = crop.startsWith("data:") ? crop : `data:image/jpeg;base64,${crop}`;
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.OPENAI_VISION_MODEL || "gpt-4o-mini",
        max_tokens: 60,
        temperature: 0,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `This is a small cropped region of a Swedish receipt. Read ${hint}. Reply with ONLY the value, no labels, no quotes. If nothing is readable, reply with an empty response.`,
              },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
      }),
    });
    if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`);
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return (json?.choices?.[0]?.message?.content ?? "").trim();
  }

  const r = await runOcrSpace(crop);
  return (r.rawText ?? "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean)[0] ?? "";
}
