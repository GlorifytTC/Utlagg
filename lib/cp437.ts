/**
 * IBM PC / Code Page 437 (a.k.a. "PC8") encoder.
 *
 * The SIE 4 file format mandates CP437-encoded bytes (declared by `#FORMAT PC8`).
 * Emitting UTF-8 corrupts Swedish characters (å ä ö Å Ä Ö) on import into many
 * accounting systems (Fortnox, Visma, Bokio). Node's standard library has no
 * CP437 codec and iconv-lite is not a dependency here, so we ship a tiny,
 * self-contained encoder built from the canonical CP437 → Unicode table.
 *
 * Bytes 0x00–0x7F are plain ASCII. The array below lists the Unicode code point
 * for each high byte 0x80–0xFF, which we invert into an encode map.
 */

// Unicode code points for CP437 high half, index 0 == byte 0x80.
const CP437_HIGH: number[] = [
  0x00c7, 0x00fc, 0x00e9, 0x00e2, 0x00e4, 0x00e0, 0x00e5, 0x00e7, // 80-87
  0x00ea, 0x00eb, 0x00e8, 0x00ef, 0x00ee, 0x00ec, 0x00c4, 0x00c5, // 88-8F
  0x00c9, 0x00e6, 0x00c6, 0x00f4, 0x00f6, 0x00f2, 0x00fb, 0x00f9, // 90-97
  0x00ff, 0x00d6, 0x00dc, 0x00a2, 0x00a3, 0x00a5, 0x20a7, 0x0192, // 98-9F
  0x00e1, 0x00ed, 0x00f3, 0x00fa, 0x00f1, 0x00d1, 0x00aa, 0x00ba, // A0-A7
  0x00bf, 0x2310, 0x00ac, 0x00bd, 0x00bc, 0x00a1, 0x00ab, 0x00bb, // A8-AF
  0x2591, 0x2592, 0x2593, 0x2502, 0x2524, 0x2561, 0x2562, 0x2556, // B0-B7
  0x2555, 0x2563, 0x2551, 0x2557, 0x255d, 0x255c, 0x255b, 0x2510, // B8-BF
  0x2514, 0x2534, 0x252c, 0x251c, 0x2500, 0x253c, 0x255e, 0x255f, // C0-C7
  0x255a, 0x2554, 0x2569, 0x2566, 0x2560, 0x2550, 0x256c, 0x2567, // C8-CF
  0x2568, 0x2564, 0x2565, 0x2559, 0x2558, 0x2552, 0x2553, 0x256b, // D0-D7
  0x256a, 0x2518, 0x250c, 0x2588, 0x2584, 0x258c, 0x2590, 0x2580, // D8-DF
  0x03b1, 0x00df, 0x0393, 0x03c0, 0x03a3, 0x03c3, 0x00b5, 0x03c4, // E0-E7
  0x03a6, 0x0398, 0x03a9, 0x03b4, 0x221e, 0x03c6, 0x03b5, 0x2229, // E8-EF
  0x2261, 0x00b1, 0x2265, 0x2264, 0x2320, 0x2321, 0x00f7, 0x2248, // F0-F7
  0x00b0, 0x2219, 0x00b7, 0x221a, 0x207f, 0x00b2, 0x25a0, 0x00a0, // F8-FF
];

// Unicode code point -> CP437 byte.
const ENCODE_MAP = new Map<number, number>();
for (let i = 0; i < CP437_HIGH.length; i++) {
  // First writer wins; the high table has no duplicate code points.
  if (!ENCODE_MAP.has(CP437_HIGH[i])) ENCODE_MAP.set(CP437_HIGH[i], 0x80 + i);
}

// Best-effort ASCII fall-backs for a few common characters that are NOT in
// CP437 but routinely show up in pasted vendor names (smart quotes, dashes,
// the euro sign). Keeps exports readable instead of dropping to '?'.
const TRANSLITERATE: Record<string, string> = {
  "‘": "'", "’": "'", "‚": ",",
  "“": '"', "”": '"', "„": '"',
  "–": "-", "—": "-", "−": "-",
  "…": "...", " ": " ", "€": "EUR",
};

export interface Cp437Warning {
  char: string;
  codePoint: number;
  /** How the character was handled: replaced with an ASCII string, or '?'. */
  replacement: string;
}

export interface Cp437Result {
  bytes: Buffer;
  warnings: Cp437Warning[];
}

/**
 * Encode a string to CP437 bytes. Characters outside CP437 are never allowed to
 * crash the export: they are transliterated to a safe ASCII equivalent where one
 * is known, otherwise replaced with '?'. Every substitution is reported so the
 * caller can log which receipt/field triggered it.
 */
export function encodeCp437(input: string): Cp437Result {
  const out: number[] = [];
  const warnings: Cp437Warning[] = [];

  for (const ch of input) {
    const cp = ch.codePointAt(0)!;

    if (cp <= 0x7f) {
      out.push(cp);
      continue;
    }

    const direct = ENCODE_MAP.get(cp);
    if (direct !== undefined) {
      out.push(direct);
      continue;
    }

    const ascii = TRANSLITERATE[ch];
    if (ascii !== undefined) {
      for (const a of ascii) out.push(a.charCodeAt(0));
      warnings.push({ char: ch, codePoint: cp, replacement: ascii });
      continue;
    }

    out.push(0x3f); // '?'
    warnings.push({ char: ch, codePoint: cp, replacement: "?" });
  }

  return { bytes: Buffer.from(out), warnings };
}
